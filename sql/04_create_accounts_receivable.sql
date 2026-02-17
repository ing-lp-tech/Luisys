-- ==============================================================================
-- MIGRACIÓN 4: Cuentas por Cobrar (Accounts Receivable)
-- ==============================================================================
-- Descripción: Sistema para gestionar deudas a favor (dinero que te deben)
--              con registro de pagos parciales y seguimiento de saldo
-- ==============================================================================

-- 1. Crear tabla accounts_receivable (cuentas por cobrar)
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cliente/Deudor
  client_name TEXT NOT NULL,
  client_dni TEXT,
  client_contact TEXT,                       -- Teléfono o email
  
  -- Concepto de la deuda
  description TEXT NOT NULL,                 -- Por qué debe dinero
  
  -- Montos (permite ambas monedas)
  total_amount_ars NUMERIC,                  -- Monto total de la deuda en ARS
  total_amount_usd NUMERIC,                  -- Monto total de la deuda en USD
  currency TEXT CHECK (currency IN ('ARS', 'USD')) DEFAULT 'ARS',
  
  amount_paid_ars NUMERIC DEFAULT 0,         -- Total pagado en ARS
  amount_paid_usd NUMERIC DEFAULT 0,         -- Total pagado en USD
  
  -- Saldo calculado automáticamente según moneda
  balance_ars NUMERIC GENERATED ALWAYS AS 
    (COALESCE(total_amount_ars, 0) - COALESCE(amount_paid_ars, 0)) STORED,
  balance_usd NUMERIC GENERATED ALWAYS AS 
    (COALESCE(total_amount_usd, 0) - COALESCE(amount_paid_usd, 0)) STORED,
  
  -- Fechas
  debt_date DATE DEFAULT CURRENT_DATE,       -- Fecha en que se generó la deuda
  due_date DATE,                             -- Fecha de vencimiento
  last_payment_date DATE,                    -- Última fecha de pago
  
  -- Estado
  status TEXT CHECK (status IN 
    ('pending', 'partial', 'paid', 'overdue', 'cancelled')
  ) DEFAULT 'pending',
  
  -- Metadatos
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla payments_received (cobros registrados)
CREATE TABLE IF NOT EXISTS payments_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  receivable_id UUID REFERENCES accounts_receivable(id) ON DELETE CASCADE NOT NULL,
  
  -- Datos del pago
  payment_date DATE DEFAULT CURRENT_DATE,
  amount_ars NUMERIC,                        -- Monto cobrado en ARS
  amount_usd NUMERIC,                        -- Monto cobrado en USD
  exchange_rate NUMERIC,                     -- Tipo de cambio usado
  payment_method TEXT,                       -- Efectivo, transferencia, cheque, etc.
  
  -- Comprobante
  receipt_file TEXT,                         -- URL del recibo o comprobante
  observations TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_receivable_client ON accounts_receivable(client_name);
CREATE INDEX IF NOT EXISTS idx_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_received_date ON payments_received(payment_date);

-- 4. Trigger para actualizar amount_paid y estado automáticamente
CREATE OR REPLACE FUNCTION update_receivable_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_ars NUMERIC;
  total_usd NUMERIC;
  receivable RECORD;
BEGIN
  -- Obtener datos de la cuenta por cobrar
  SELECT * INTO receivable FROM accounts_receivable WHERE id = NEW.receivable_id;
  
  -- Calcular total pagado
  SELECT 
    COALESCE(SUM(amount_ars), 0),
    COALESCE(SUM(amount_usd), 0)
  INTO total_ars, total_usd
  FROM payments_received 
  WHERE receivable_id = NEW.receivable_id;
  
  -- Actualizar la cuenta por cobrar
  UPDATE accounts_receivable SET
    amount_paid_ars = total_ars,
    amount_paid_usd = total_usd,
    last_payment_date = NEW.payment_date,
    status = CASE
      WHEN receivable.currency = 'ARS' AND total_ars >= receivable.total_amount_ars THEN 'paid'
      WHEN receivable.currency = 'USD' AND total_usd >= receivable.total_amount_usd THEN 'paid'
      WHEN total_ars > 0 OR total_usd > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.receivable_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receivable_after_payment
AFTER INSERT OR DELETE ON payments_received
FOR EACH ROW
EXECUTE FUNCTION update_receivable_on_payment();

-- 5. Trigger para marcar como overdue automáticamente
CREATE OR REPLACE FUNCTION check_overdue_receivables()
RETURNS VOID AS $$
BEGIN
  UPDATE accounts_receivable
  SET status = 'overdue'
  WHERE status IN ('pending', 'partial')
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
CREATE TRIGGER trigger_update_receivable_timestamp
BEFORE UPDATE ON accounts_receivable
FOR EACH ROW
EXECUTE FUNCTION update_supplies_updated_at();

-- 7. Habilitar RLS
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_received ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de acceso
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON accounts_receivable;
CREATE POLICY "Enable all access for authenticated users"
ON accounts_receivable FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payments_received;
CREATE POLICY "Enable all access for authenticated users"
ON payments_received FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Comentarios
COMMENT ON TABLE accounts_receivable IS 'Cuentas por cobrar - deudas a favor';
COMMENT ON TABLE payments_received IS 'Registro de cobros recibidos';
COMMENT ON COLUMN accounts_receivable.balance_ars IS 'Saldo pendiente en ARS (calculado automáticamente)';

-- ==============================================================================
-- FIN DE MIGRACIÓN 4
-- ==============================================================================
