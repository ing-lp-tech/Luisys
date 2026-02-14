-- ==============================================================================
-- MIGRACIÓN: Agregar campos para pagos parciales, observaciones e imágenes
-- ==============================================================================
-- Ejecutar en el Editor SQL de Supabase
-- Proyecto: uwtqrujdvpjrlllmffif
-- ==============================================================================

-- 1. Agregar columnas nuevas a inventory_items
DO $$
BEGIN
    -- Campo de observaciones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_items' AND column_name='observations') THEN
        ALTER TABLE inventory_items ADD COLUMN observations TEXT;
        COMMENT ON COLUMN inventory_items.observations IS 'Notas y observaciones sobre la venta';
    END IF;

    -- Campo de monto pagado en ARS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_items' AND column_name='amount_paid_ars') THEN
        ALTER TABLE inventory_items ADD COLUMN amount_paid_ars NUMERIC DEFAULT 0;
        COMMENT ON COLUMN inventory_items.amount_paid_ars IS 'Monto pagado por el cliente en pesos argentinos';
    END IF;

    -- Campo de estado de pago
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_items' AND column_name='payment_status') THEN
        ALTER TABLE inventory_items ADD COLUMN payment_status TEXT DEFAULT 'pending' 
            CHECK (payment_status IN ('pending', 'paid'));
        COMMENT ON COLUMN inventory_items.payment_status IS 'Estado del pago: pending (pendiente) o paid (pagado)';
    END IF;

    -- Campo de imágenes del producto (separado de contract_files)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_items' AND column_name='product_images') THEN
        ALTER TABLE inventory_items ADD COLUMN product_images TEXT[];
        COMMENT ON COLUMN inventory_items.product_images IS 'URLs de imágenes del producto (máximo 5)';
    END IF;
END $$;

-- 2. Actualizar función get_inventory para incluir nuevos campos
DROP FUNCTION IF EXISTS get_inventory();

CREATE OR REPLACE FUNCTION get_inventory()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  serial_number text,
  model_variant text,
  cost_usd numeric,
  cost_ars numeric,
  purchase_date date,
  status text,
  sale_date date,
  client_name text,
  client_dni text,
  sale_price_usd numeric,
  sale_price_ars numeric,
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
    i.cost_usd,
    i.cost_ars,
    i.purchase_date,
    i.status,
    i.sale_date,
    i.client_name,
    i.client_dni,
    i.sale_price_usd,
    i.sale_price_ars,
    i.contract_files,
    i.observations,
    i.amount_paid_ars,
    i.payment_status,
    i.product_images,
    i.created_at,
    p.nombre as product_name
  FROM inventory_items i
  LEFT JOIN productos p ON i.product_id = p.id
  ORDER BY i.created_at DESC;
END;
$$;

-- 3. Permisos (idempotente)
GRANT EXECUTE ON FUNCTION get_inventory() TO authenticated, service_role, anon;

-- 4. Recargar configuración
NOTIFY pgrst, 'reload config';

-- ==============================================================================
-- NOTA: Ejecutar este script completo en Supabase SQL Editor
-- ==============================================================================
