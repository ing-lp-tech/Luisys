-- ==============================================================================
-- ADD DNI FIELD TO SALES
-- ==============================================================================

-- 1. Añadir columna a la tabla (Si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='client_dni') THEN
        ALTER TABLE inventory_items ADD COLUMN client_dni text;
    END IF;
END $$;

-- 2. Actualizar función get_inventory para incluir el nuevo campo
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
  client_dni text, -- NUEVO CAMPO
  sale_price_usd numeric,
  sale_price_ars numeric,
  contract_files text[],
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
    i.client_dni, -- NUEVO CAMPO
    i.sale_price_usd,
    i.sale_price_ars,
    i.contract_files,
    i.created_at,
    p.nombre as product_name
  FROM inventory_items i
  LEFT JOIN productos p ON i.product_id = p.id
  ORDER BY i.created_at DESC;
END;
$$;

-- 3. Confirmar permisos
GRANT EXECUTE ON FUNCTION get_inventory() TO authenticated, service_role, anon;
GRANT ALL ON TABLE inventory_items TO authenticated;

-- 4. Recargar caché
NOTIFY pgrst, 'reload config';
