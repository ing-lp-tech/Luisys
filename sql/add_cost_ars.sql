-- Add cost_ars column to inventory_items
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS cost_ars numeric;

COMMENT ON COLUMN inventory_items.cost_ars IS 'Cost of the item in Argentine Pesos (ARS)';
