-- ==============================================================================
-- MIGRACIÓN 8: Plan de cuotas con fecha límite por cuota
-- ==============================================================================
-- Requiere haber corrido 07_sales_installments.sql. Es idempotente.
--
-- Qué cambia:
--   * Nueva tabla sale_installments: cada cuota de una venta con su monto y su
--     fecha límite de pago (pueden ser montos y fechas distintas entre cuotas).
--   * Los pagos (sale_payments) se siguen registrando aparte; la app reparte lo
--     cobrado sobre las cuotas en orden para saber cuáles están pagadas,
--     vencidas o por vencer.
--   * Corrige el trigger de estado de pago para que nunca pise datos al
--     modificar una venta sin precio/moneda.
-- ==============================================================================

-- 1. TABLA DE CUOTAS ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_installments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id            UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
  due_date           DATE NOT NULL,                       -- Fecha límite de pago
  amount             NUMERIC NOT NULL CHECK (amount > 0), -- En la moneda de la venta
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_sale_installments_item ON sale_installments(item_id);
CREATE INDEX IF NOT EXISTS idx_sale_installments_due  ON sale_installments(due_date);

COMMENT ON TABLE  sale_installments          IS 'Plan de cuotas de cada venta: monto y fecha límite por cuota';
COMMENT ON COLUMN sale_installments.amount   IS 'Monto de la cuota en la moneda de la venta (inventory_items.sale_currency)';
COMMENT ON COLUMN sale_installments.due_date IS 'Fecha límite de pago de la cuota';

-- 2. TRIGGER DE ESTADO (versión corregida) ---------------------------------------
-- Solo recalcula payment_status cuando cambia algo que lo afecta y no toca
-- amount_paid_ars salvo que haya pagos registrados que lo respalden.
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

  IF TG_OP = 'UPDATE'
     AND NEW.amount_paid     IS NOT DISTINCT FROM OLD.amount_paid
     AND NEW.sale_price_usd  IS NOT DISTINCT FROM OLD.sale_price_usd
     AND NEW.sale_price_ars  IS NOT DISTINCT FROM OLD.sale_price_ars
     AND NEW.sale_currency   IS NOT DISTINCT FROM OLD.sale_currency
     AND NEW.status          IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  v_total := CASE NEW.sale_currency WHEN 'USD' THEN NEW.sale_price_usd ELSE NEW.sale_price_ars END;
  NEW.amount_paid := COALESCE(NEW.amount_paid, 0);

  IF NEW.sale_currency = 'ARS' AND EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.item_id = NEW.id) THEN
    NEW.amount_paid_ars := NEW.amount_paid;
  END IF;

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

-- 3. GENERAR CUOTAS PARA VENTAS QUE YA TENÍAN "N cuotas" PERO SIN PLAN ------------
INSERT INTO sale_installments (item_id, installment_number, due_date, amount)
SELECT i.id,
       g.n,
       (COALESCE(i.first_due_date, i.sale_date, CURRENT_DATE) + ((g.n - 1) * INTERVAL '1 month'))::date,
       ROUND(CASE i.sale_currency WHEN 'USD' THEN i.sale_price_usd ELSE i.sale_price_ars END / i.installments_count, 2)
FROM inventory_items i
CROSS JOIN LATERAL generate_series(1, i.installments_count) AS g(n)
WHERE i.status = 'sold'
  AND COALESCE(i.installments_count, 1) > 1
  AND COALESCE(CASE i.sale_currency WHEN 'USD' THEN i.sale_price_usd ELSE i.sale_price_ars END, 0) > 0
  AND NOT EXISTS (SELECT 1 FROM sale_installments si WHERE si.item_id = i.id);

-- 4. SEGURIDAD ------------------------------------------------------------------
ALTER TABLE sale_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sale_installments;
CREATE POLICY "Enable all access for authenticated users"
ON sale_installments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE sale_installments TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
