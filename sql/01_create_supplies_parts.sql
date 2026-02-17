-- ==============================================================================
-- MIGRACIÓN 1: Tabla de Repuestos e Insumos
-- ==============================================================================
-- Descripción: Crea tabla para gestionar repuestos, insumos y mercaderías
--              sin número de serie individual, con stock y costos en ARS/USD
-- ==============================================================================

-- 1. Crear tabla supplies_parts
CREATE TABLE IF NOT EXISTS supplies_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación del item
  item_code TEXT NOT NULL,                    -- Código HS, NCM o código interno
  name TEXT NOT NULL,                          -- Nombre del repuesto/insumo
  description TEXT,                            -- Descripción detallada
  category TEXT CHECK (category IN             -- Categoría del item
    ('repuesto', 'insumo', 'mercaderia', 'materia_prima', 'otro')
  ) DEFAULT 'repuesto',
  
  -- Datos del producto
  photo_url TEXT,                              -- URL de la foto del item
  color TEXT,                                  -- Color (si aplica)
  ctn_size TEXT,                               -- Tamaño de caja/empaque  
  ctn_quantity INTEGER,                        -- Cantidad por caja/cartón
  
  -- Datos de compra (permite ambas monedas)
  cost_per_unit_usd NUMERIC,                   -- Costo unitario en USD
  cost_per_unit_ars NUMERIC,                   -- Costo unitario en ARS
  total_cost_usd NUMERIC,                      -- Costo total de la compra en USD
  total_cost_ars NUMERIC,                      -- Costo total de la compra en ARS
  
  -- Proveedor
  supplier TEXT,                               -- Nombre del proveedor
  supplier_contact TEXT,                       -- Contacto del proveedor
  
  -- Compra
  purchase_date DATE DEFAULT CURRENT_DATE,     -- Fecha de compra
  exchange_rate NUMERIC,                       -- Tipo de cambio usado (ARS/USD)
  exchange_rate_source TEXT,                   -- Origen: 'blue', 'oficial', 'manual'
  
  -- Control de inventario
  quantity_purchased INTEGER DEFAULT 0,        -- Cantidad comprada originalmente
  quantity_in_stock INTEGER DEFAULT 0,         -- Stock actual disponible
  quantity_used INTEGER DEFAULT 0,             -- Cantidad ya utilizada/vendida
  min_stock_alert INTEGER,                     -- Nivel mínimo para alertar
  
  -- Metadatos
  observations TEXT,                           -- Observaciones generales
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_supplies_item_code ON supplies_parts(item_code);
CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies_parts(category);
CREATE INDEX IF NOT EXISTS idx_supplies_purchase_date ON supplies_parts(purchase_date);

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_supplies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplies_timestamp
BEFORE UPDATE ON supplies_parts
FOR EACH ROW
EXECUTE FUNCTION update_supplies_updated_at();

-- 4. Trigger para mantener sincronizado quantity_used
CREATE OR REPLACE FUNCTION sync_supplies_quantity_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quantity_used = NEW.quantity_purchased - NEW.quantity_in_stock;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_supplies_quantity
BEFORE INSERT OR UPDATE OF quantity_in_stock, quantity_purchased ON supplies_parts
FOR EACH ROW
EXECUTE FUNCTION sync_supplies_quantity_used();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE supplies_parts ENABLE ROW LEVEL SECURITY;

-- 6. Política de acceso para usuarios autenticados
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON supplies_parts;
CREATE POLICY "Enable all access for authenticated users"
ON supplies_parts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Comentarios en la tabla
COMMENT ON TABLE supplies_parts IS 'Repuestos, insumos y mercaderías sin número de serie';
COMMENT ON COLUMN supplies_parts.item_code IS 'Código HS/NCM o código interno del item';
COMMENT ON COLUMN supplies_parts.exchange_rate_source IS 'Origen del tipo de cambio: blue, oficial, o manual';
COMMENT ON COLUMN supplies_parts.quantity_used IS 'Calculado automáticamente: quantity_purchased - quantity_in_stock';

-- ==============================================================================
-- FIN DE MIGRACIÓN 1
-- ==============================================================================
