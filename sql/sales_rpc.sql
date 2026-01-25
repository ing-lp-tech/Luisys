-- DROP existing functions to allow return type changes
DROP FUNCTION IF EXISTS get_inventory_v2();
-- We drop the old signature of register_entry_v2 to avoid duplicates
DROP FUNCTION IF EXISTS register_entry_v2(uuid, text, text, numeric, date);

-- FUNCTION: get_inventory_v2
-- Returns inventory items with product names joined
CREATE OR REPLACE FUNCTION get_inventory_v2()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  serial_number text,
  model_variant text,
  cost_usd numeric,
  cost_ars numeric, -- NEW: Added cost_ars
  purchase_date date,
  status text,
  sale_date date,
  client_name text,
  sale_price_usd numeric,
  sale_price_ars numeric,
  contract_files text[],
  created_at timestamptz,
  product_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.product_id,
    i.serial_number,
    i.model_variant,
    i.cost_usd,
    i.cost_ars, -- NEW
    i.purchase_date,
    i.status,
    i.sale_date,
    i.client_name,
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

-- FUNCTION: register_entry_v2
-- Securely inserts a new inventory item
CREATE OR REPLACE FUNCTION register_entry_v2(
  p_product_id uuid,
  p_serial_number text,
  p_model_variant text,
  p_cost_usd numeric,
  p_cost_ars numeric, -- NEW: Added parameter
  p_purchase_date date
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO inventory_items (
    product_id,
    serial_number,
    model_variant,
    cost_usd,
    cost_ars, -- NEW
    purchase_date,
    status
  ) VALUES (
    p_product_id,
    p_serial_number,
    p_model_variant,
    p_cost_usd,
    p_cost_ars, -- NEW
    p_purchase_date,
    'available'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;
