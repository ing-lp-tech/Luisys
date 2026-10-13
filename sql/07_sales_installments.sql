-- ==============================================================================
-- MIGRACIÓN 7: Ventas en una sola moneda + pagos en cuotas
-- ==============================================================================
-- Ejecutar completo en el Editor SQL de Supabase. Es idempotente (se puede
-- correr más de una vez sin romper nada).
--
-- Qué cambia:
--   * Cada compra y cada venta se fija en UNA moneda (ARS o USD):
--       cost_currency / sale_currency. El monto se guarda en la columna de esa
--       moneda (cost_usd|cost_ars, sale_price_usd|sale_price_ars) y la otra
--       queda en NULL.
--   * Plan de cuotas en la venta: installments_count, installment_amount,
--     first_due_date (vencimientos mensuales a partir de esa fecha).
--   * Nueva tabla sale_payments: un registro por cada pago/cuota cobrada.
--     Se puede cobrar en otra moneda indicando el tipo de cambio.
--   * amount_paid y payment_status ('pending' | 'partial' | 'paid') se
--     calculan solos con triggers a partir de los pagos.
-- ==============================================================================

-- 1. NUEVAS COLUMNAS EN inventory_items -----------------------------------------
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_currency      TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS sale_currency      TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS amount_paid        NUMERIC DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS installments_count INTEGER DEFAULT 1;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS installment_amount NUMERIC;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS first_due_date     DATE;
-- Por si alguna instancia no corrió add_payment_fields.sql / add_dni_field.sql
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS client_dni         TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS observations       TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS amount_paid_ars    NUMERIC DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS payment_status     TEXT DEFAULT 'pending';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS product_images     TEXT[];

COMMENT ON COLUMN inventory_items.cost_currency      IS 'Moneda de la compra: ARS o USD';
COMMENT ON COLUMN inventory_items.sale_currency      IS 'Moneda en la que se fijó la venta: ARS o USD';
COMMENT ON COLUMN inventory_items.amount_paid        IS 'Total cobrado, expresado en sale_currency (lo calcula el trigger)';
COMMENT ON COLUMN inventory_items.installments_count IS 'Cantidad de cuotas pactadas (1 = contado)';
COMMENT ON COLUMN inventory_items.installment_amount IS 'Monto de cada cuota en sale_currency';
COMMENT ON COLUMN inventory_items.first_due_date     IS 'Vencimiento de la primera cuota; las siguientes vencen cada mes';

-- Reemplazar el CHECK viejo de payment_status ('pending','paid') por uno con 'partial'
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT DISTINCT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.inventory_items'::regclass
      AND con.contype = 'c'
      AND att.attname IN ('payment_status', 'cost_currency', 'sale_currency', 'installments_count')
  LOOP
    EXECUTE format('ALTER TABLE inventory_items DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_payment_status_check
  CHECK (payment_status IN ('pending', 'partial', 'paid'));
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_cost_currency_check
  CHECK (cost_currency IS NULL OR cost_currency IN ('ARS', 'USD'));
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_sale_currency_check
  CHECK (sale_currency IS NULL OR sale_currency IN ('ARS', 'USD'));
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_installments_count_check
  CHECK (installments_count IS NULL OR installments_count >= 1);

-- 2. TABLA DE PAGOS / CUOTAS ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id            UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  installment_number INTEGER,                         -- Nro. de cuota (opcional)
  payment_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  amount             NUMERIC NOT NULL CHECK (amount > 0),
  currency           TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  exchange_rate      NUMERIC CHECK (exchange_rate IS NULL OR exchange_rate > 0), -- ARS por 1 USD
  amount_applied     NUMERIC,                         -- Monto convertido a la moneda de la venta (trigger)
  payment_method     TEXT,                            -- Efectivo, transferencia, cheque...
  notes              TEXT,
  receipt_url        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_item ON sale_payments(item_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_date ON sale_payments(payment_date);

COMMENT ON TABLE  sale_payments IS 'Pagos/cuotas cobradas por cada venta de inventory_items';
COMMENT ON COLUMN sale_payments.exchange_rate  IS 'Pesos por dólar. Obligatorio si la moneda del pago es distinta a la de la venta';
COMMENT ON COLUMN sale_payments.amount_applied IS 'Monto que descuenta de la deuda, en la moneda de la venta';

-- 3. TRIGGERS -------------------------------------------------------------------

-- 3a. Antes de guardar un pago: calcular amount_applied según la moneda de la venta
CREATE OR REPLACE FUNCTION sale_payments_apply_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_currency TEXT;
BEGIN
  SELECT COALESCE(sale_currency, 'ARS') INTO v_sale_currency
  FROM inventory_items WHERE id = NEW.item_id;

  IF NEW.currency = v_sale_currency THEN
    NEW.amount_applied := NEW.amount;
  ELSE
    IF NEW.exchange_rate IS NULL THEN
      RAISE EXCEPTION 'El pago es en % pero la venta es en %: indicá el tipo de cambio', NEW.currency, v_sale_currency;
    END IF;
    IF v_sale_currency = 'USD' THEN
      NEW.amount_applied := ROUND(NEW.amount / NEW.exchange_rate, 2); -- cobro en pesos de una venta en dólares
    ELSE
      NEW.amount_applied := ROUND(NEW.amount * NEW.exchange_rate, 2); -- cobro en dólares de una venta en pesos
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sale_payments_apply_currency ON sale_payments;
CREATE TRIGGER trg_sale_payments_apply_currency
BEFORE INSERT OR UPDATE ON sale_payments
FOR EACH ROW EXECUTE FUNCTION sale_payments_apply_currency();

-- 3b. Después de insertar/editar/borrar un pago: recalcular lo cobrado en la venta
CREATE OR REPLACE FUNCTION recalc_item_amount_paid(p_item_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE inventory_items i
  SET amount_paid = COALESCE((SELECT SUM(sp.amount_applied) FROM sale_payments sp WHERE sp.item_id = p_item_id), 0)
  WHERE i.id = p_item_id;
$$;

CREATE OR REPLACE FUNCTION sale_payments_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM recalc_item_amount_paid(OLD.item_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.item_id <> OLD.item_id) THEN
    PERFORM recalc_item_amount_paid(NEW.item_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sale_payments_after_change ON sale_payments;
CREATE TRIGGER trg_sale_payments_after_change
AFTER INSERT OR UPDATE OR DELETE ON sale_payments
FOR EACH ROW EXECUTE FUNCTION sale_payments_after_change();

-- 3c. Antes de guardar una venta: derivar payment_status a partir de total vs. cobrado
CREATE OR REPLACE FUNCTION inventory_items_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  IF NEW.status <> 'sold' OR NEW.sale_currency IS NULL THEN
    RETURN NEW;
  END IF;

  v_total := CASE NEW.sale_currency WHEN 'USD' THEN NEW.sale_price_usd ELSE NEW.sale_price_ars END;
  NEW.amount_paid := COALESCE(NEW.amount_paid, 0);

  -- Compatibilidad con pantallas viejas que leen amount_paid_ars
  IF NEW.sale_currency = 'ARS' THEN
    NEW.amount_paid_ars := NEW.amount_paid;
  END IF;

  -- Sin precio cargado no podemos saber si está saldado: respetamos lo que haya
  IF COALESCE(v_total, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  NEW.payment_status := CASE
    WHEN NEW.amount_paid >= v_total - 0.01 THEN 'paid'
    WHEN NEW.amount_paid > 0              THEN 'partial'
    ELSE 'pending'
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_items_payment_status ON inventory_items;
CREATE TRIGGER trg_inventory_items_payment_status
BEFORE INSERT OR UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION inventory_items_payment_status();

-- 4. MIGRAR DATOS EXISTENTES ----------------------------------------------------
-- El trigger de estado se apaga mientras se migra: si no, al asignar
-- sale_currency recalcularía todo como 'pending' antes de crear los pagos.
ALTER TABLE inventory_items DISABLE TRIGGER trg_inventory_items_payment_status;

-- Moneda de compra: la que tenga monto (USD tiene prioridad si están ambas)
UPDATE inventory_items
SET cost_currency = CASE
  WHEN COALESCE(cost_usd, 0) > 0 THEN 'USD'
  WHEN COALESCE(cost_ars, 0) > 0 THEN 'ARS'
  ELSE 'USD'
END
WHERE cost_currency IS NULL;

-- Moneda de venta: si había pagos en ARS o solo precio ARS -> ARS; si no, USD
UPDATE inventory_items
SET sale_currency = CASE
  WHEN COALESCE(sale_price_ars, 0) > 0 AND (COALESCE(sale_price_usd, 0) = 0 OR COALESCE(amount_paid_ars, 0) > 0) THEN 'ARS'
  WHEN COALESCE(sale_price_usd, 0) > 0 THEN 'USD'
  ELSE 'ARS'
END
WHERE status = 'sold' AND sale_currency IS NULL;

-- Ventas que estaban marcadas como PAGADO a mano pero sin pagos registrados:
-- se crea un pago por el total para que el saldo dé 0
INSERT INTO sale_payments (item_id, installment_number, payment_date, amount, currency, notes)
SELECT i.id, 1, COALESCE(i.sale_date, CURRENT_DATE),
       CASE i.sale_currency WHEN 'USD' THEN i.sale_price_usd ELSE i.sale_price_ars END,
       i.sale_currency, 'Pago total migrado (estaba marcado como pagado)'
FROM inventory_items i
WHERE i.status = 'sold'
  AND i.payment_status = 'paid'
  AND COALESCE(CASE i.sale_currency WHEN 'USD' THEN i.sale_price_usd ELSE i.sale_price_ars END, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.item_id = i.id);

-- Pasar el "monto pagado" viejo a un registro de pago (solo ventas en ARS,
-- y solo si esa venta todavía no tiene pagos cargados)
INSERT INTO sale_payments (item_id, installment_number, payment_date, amount, currency, payment_method, notes)
SELECT i.id, 1, COALESCE(i.sale_date, CURRENT_DATE), i.amount_paid_ars, 'ARS', NULL, 'Pago migrado del sistema anterior'
FROM inventory_items i
WHERE i.status = 'sold'
  AND i.sale_currency = 'ARS'
  AND COALESCE(i.amount_paid_ars, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.item_id = i.id);

-- Recalcular amount_paid / payment_status de todas las ventas
ALTER TABLE inventory_items ENABLE TRIGGER trg_inventory_items_payment_status;
UPDATE inventory_items i
SET amount_paid = COALESCE((SELECT SUM(sp.amount_applied) FROM sale_payments sp WHERE sp.item_id = i.id), 0)
WHERE i.status = 'sold';

-- 5. RPC get_inventory (con los campos nuevos) ----------------------------------
DROP FUNCTION IF EXISTS get_inventory();

CREATE OR REPLACE FUNCTION get_inventory()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  serial_number text,
  model_variant text,
  cost_currency text,
  cost_usd numeric,
  cost_ars numeric,
  purchase_date date,
  status text,
  sale_date date,
  client_name text,
  client_dni text,
  sale_currency text,
  sale_price_usd numeric,
  sale_price_ars numeric,
  amount_paid numeric,
  installments_count integer,
  installment_amount numeric,
  first_due_date date,
  payments_count bigint,
  last_payment_date date,
  contract_files text[],
  observations text,
  amount_paid_ars numeric,
  payment_status text,
  product_images text[],
  created_at timestamptz,
  product_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.product_id,
    i.serial_number,
    i.model_variant,
    i.cost_currency,
    i.cost_usd,
    i.cost_ars,
    i.purchase_date,
    i.status,
    i.sale_date,
    i.client_name,
    i.client_dni,
    i.sale_currency,
    i.sale_price_usd,
    i.sale_price_ars,
    i.amount_paid,
    i.installments_count,
    i.installment_amount,
    i.first_due_date,
    COALESCE(pay.cnt, 0) AS payments_count,
    pay.last_date AS last_payment_date,
    i.contract_files,
    i.observations,
    i.amount_paid_ars,
    i.payment_status,
    i.product_images,
    i.created_at,
    p.nombre AS product_name
  FROM inventory_items i
  LEFT JOIN productos p ON i.product_id = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt, MAX(sp.payment_date) AS last_date
    FROM sale_payments sp
    WHERE sp.item_id = i.id
  ) pay ON true
  ORDER BY i.created_at DESC;
END;
$$;

-- register_entry con moneda de compra
DROP FUNCTION IF EXISTS register_entry(uuid, text, text, numeric, numeric, date);
DROP FUNCTION IF EXISTS register_entry(uuid, text, text, text, numeric, numeric, date);

CREATE OR REPLACE FUNCTION register_entry(
  p_product_id uuid,
  p_serial_number text,
  p_model_variant text,
  p_cost_currency text,
  p_cost_usd numeric,
  p_cost_ars numeric,
  p_purchase_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO inventory_items (
    product_id, serial_number, model_variant,
    cost_currency, cost_usd, cost_ars, purchase_date, status
  ) VALUES (
    p_product_id, p_serial_number, p_model_variant,
    p_cost_currency, p_cost_usd, p_cost_ars, p_purchase_date, 'available'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 6. SEGURIDAD ------------------------------------------------------------------
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sale_payments;
CREATE POLICY "Enable all access for authenticated users"
ON sale_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE sale_payments TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_inventory() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION register_entry(uuid, text, text, text, numeric, numeric, date) TO authenticated, service_role;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- 7. REVISIÓN MANUAL ------------------------------------------------------------
-- Ventas en USD que tenían un "monto pagado" en pesos del sistema viejo: no se
-- puede saber a qué cotización se cobró, así que NO se migró ese pago. Cargalo
-- desde la app (botón "Pagos") indicando el tipo de cambio.
SELECT i.serial_number, i.client_name, i.sale_price_usd, i.amount_paid_ars AS pagado_ars_viejo
FROM inventory_items i
WHERE i.status = 'sold'
  AND i.sale_currency = 'USD'
  AND COALESCE(i.amount_paid_ars, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.item_id = i.id);

-- ==============================================================================
-- Verificación rápida (opcional):
--   SELECT serial_number, sale_currency, sale_price_usd, sale_price_ars,
--          amount_paid, installments_count, payment_status
--   FROM inventory_items WHERE status = 'sold';
--   SELECT * FROM sale_payments ORDER BY payment_date DESC;
-- ==============================================================================
