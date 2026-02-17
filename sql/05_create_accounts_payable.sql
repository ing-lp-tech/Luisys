-- ==============================================================================
-- MIGRACIÓN 5: Cuentas por Pagar (Accounts Payable)
-- ==============================================================================
-- Descripción: Sistema para gestionar deudas propias (dinero que debes)
--              con registro de pagos realizados y seguimiento de saldo
-- ==============================================================================

-- 1. Crear tabla accounts_payable (cuentas por pagar)
CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Proveedor/Acreedor
  creditor_name TEXT NOT NULL,
  creditor_contact TEXT,                     -- Teléfono o email
  
  -- Concepto de la deuda
  description TEXT NOT NULL,                 -- Por qué debes dinero
  
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

-- 2. Crear tabla payments_made (pagos realizados)
CREATE TABLE IF NOT EXISTS payments_made (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  payable_id UUID REFERENCES accounts_payable(id) ON DELETE CASCADE NOT NULL,
  
  -- Datos del pago
  payment_date DATE DEFAULT CURRENT_DATE,
  amount_ars NUMERIC,                        -- Monto pagado en ARS
  amount_usd NUMERIC,                        -- Monto pagado en USD
  exchange_rate NUMERIC,                     -- Tipo de cambio usado
  payment_method TEXT,                       -- Efectivo, transferencia, cheque, etc.
  
  -- Comprobante
  receipt_file TEXT,                         -- URL del comprobante de pago
  observations TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_payable_creditor ON accounts_payable(creditor_name);
CREATE INDEX IF NOT EXISTS idx_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_made_date ON payments_made(payment_date);

-- 4. Trigger para actualizar amount_paid y estado automáticamente
CREATE OR REPLACE FUNCTION update_payable_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_ars NUMERIC;
  total_usd NUMERIC;
  payable RECORD;
BEGIN
  -- Obtener datos de la cuenta por pagar
  SELECT * INTO payable FROM accounts_payable WHERE id = NEW.payable_id;
  
  -- Calcular total pagado
  SELECT 
    COALESCE(SUM(amount_ars), 0),
    COALESCE(SUM(amount_usd), 0)
  INTO total_ars, total_usd
  FROM payments_made 
  WHERE payable_id = NEW.payable_id;
  
  -- Actualizar la cuenta por pagar
  UPDATE accounts_payable SET
    amount_paid_ars = total_ars,
    amount_paid_usd = total_usd,
    last_payment_date = NEW.payment_date,
    status = CASE
      WHEN payable.currency = 'ARS' AND total_ars >= payable.total_amount_ars THEN 'paid'
      WHEN payable.currency = 'USD' AND total_usd >= payable.total_amount_usd THEN 'paid'
      WHEN total_ars > 0 OR total_usd > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.payable_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payable_after_payment
AFTER INSERT OR DELETE ON payments_made
FOR EACH ROW
EXECUTE FUNCTION update_payable_on_payment();

-- 5. Trigger para marcar como overdue automáticamente
CREATE OR REPLACE FUNCTION check_overdue_payables()
RETURNS VOID AS $$
BEGIN
  UPDATE accounts_payable
  SET status = 'overdue'
  WHERE status IN ('pending', 'partial')
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
CREATE TRIGGER trigger_update_payable_timestamp
BEFORE UPDATE ON accounts_payable
FOR EACH ROW
EXECUTE FUNCTION update_supplies_updated_at();

-- 7. Habilitar RLS
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_made ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de acceso
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON accounts_payable;
CREATE POLICY "Enable all access for authenticated users"
ON accounts_payable FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payments_made;
CREATE POLICY "Enable all access for authenticated users"
ON payments_made FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Comentarios
COMMENT ON TABLE accounts_payable IS 'Cuentas por pagar - deudas propias';
COMMENT ON TABLE payments_made IS 'Registro de pagos realizados';
COMMENT ON COLUMN accounts_payable.balance_ars IS 'Saldo pendiente en ARS (calculado automáticamente)';

-- ==============================================================================
-- FIN DE MIGRACIÓN 5
-- ==============================================================================
