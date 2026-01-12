-- ========================================
-- MIGRACIÓN V2: Productos con Categorías
-- ========================================

-- Paso 1: Agregar columnas nuevas a la tabla productos
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(30),
  ADD COLUMN IF NOT EXISTS precio_preventa_usd DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS combos JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stock_actual INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Paso 2: Crear índices para mejorar queries por categoría
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- Paso 3: Comentarios para documentación
COMMENT ON COLUMN productos.categoria IS 'Categoría del producto: Papel marrón, Papel blanco, Plotters inyección, Plotters corte, Computadoras, Seguridad';
COMMENT ON COLUMN productos.tipo IS 'Tipo general: papel, plotter, computadora, camara';
COMMENT ON COLUMN productos.specs IS 'Especificaciones técnicas en formato JSON';
COMMENT ON COLUMN productos.combos IS 'Precios por combo (5u, 15u, 30u) en formato JSON';
COMMENT ON COLUMN productos.tags IS 'Etiquetas para búsqueda y filtrado';

-- Paso 4: Actualizar políticas RLS si es necesario
-- (ya existen las políticas básicas, solo verificamos)
