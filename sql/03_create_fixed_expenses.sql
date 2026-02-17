-- ==============================================================================
-- MIGRACIÓN 3: Gastos Fijos Mensuales
-- ==============================================================================
-- Descripción: Crea tablas para gestionar gastos fijos recurrentes (alquiler,
--              servicios, etc.) y su registro de pagos mensuales
-- ==============================================================================

-- 1. Crear tabla fixed_expenses (gastos fijos)
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación del gasto
  expense_name TEXT NOT NULL,                -- Nombre del gasto (ej: "Alquiler Oficina")
  category TEXT CHECK (category IN           -- Categoría
    ('alquiler', 'servicios', 'impuestos', 'salarios', 'telefono', 'internet', 'otro')
  ) DEFAULT 'otro',
  
  -- Monto (permite ambas monedas)
  amount_ars NUMERIC,                        -- Monto en pesos argentinos
  amount_usd NUMERIC,                        -- Monto en dólares (si aplica)
  currency TEXT CHECK (currency IN ('ARS', 'USD')) DEFAULT 'ARS',
  
  -- Periodicidad
  recurrence TEXT CHECK (recurrence IN       -- Frecuencia del gasto
    ('mensual', 'bimestral', 'trimestral', 'semestral', 'anual')
  ) DEFAULT 'mensual',
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31), -- Día de vencimiento
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,            -- Si el gasto sigue vigente
  
  -- Metadatos
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla expense_payments (registro de pagos de gastos)
CREATE TABLE IF NOT EXISTS expense_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  expense_id UUID REFERENCES fixed_expenses(id) ON DELETE CASCADE NOT NULL,
  
  -- Período al que corresponde el pago
  payment_month INTEGER CHECK (payment_month >= 1 AND payment_month <= 12) NOT NULL,
  payment_year INTEGER NOT NULL,
  
  -- Datos del pago
  payment_date DATE DEFAULT CURRENT_DATE,
  amount_paid_ars NUMERIC,                   -- Monto pagado en ARS
  amount_paid_usd NUMERIC,                   -- Monto pagado en USD
  exchange_rate NUMERIC,                     -- Tipo de cambio usado
  payment_method TEXT,                       -- Efectivo, transferencia, débito, etc.
  
  -- Comprobante
  receipt_file TEXT,                         -- URL del comprobante/factura
  observations TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint único: un gasto solo puede pagarse una vez por mes/año
  UNIQUE(expense_id, payment_month, payment_year)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_active ON fixed_expenses(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_expense_payments_period ON expense_payments(payment_year, payment_month);
CREATE INDEX IF NOT EXISTS idx_expense_payments_expense ON expense_payments(expense_id);

-- 4. Trigger para updated_at
CREATE TRIGGER trigger_update_fixed_expenses_timestamp
BEFORE UPDATE ON fixed_expenses
FOR EACH ROW
EXECUTE FUNCTION update_supplies_updated_at(); -- Reutilizamos la función

-- 5. Habilitar RLS
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acceso
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON fixed_expenses;
CREATE POLICY "Enable all access for authenticated users"
ON fixed_expenses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON expense_payments;
CREATE POLICY "Enable all access for authenticated users"
ON expense_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Comentarios
COMMENT ON TABLE fixed_expenses IS 'Gastos fijos mensuales recurrentes';
COMMENT ON TABLE expense_payments IS 'Registro de pagos de gastos fijos';
COMMENT ON COLUMN expense_payments.payment_month IS 'Mes al que corresponde el pago (1-12)';

-- ==============================================================================
-- FIN DE MIGRACIÓN 3
-- ==============================================================================
