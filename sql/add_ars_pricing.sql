-- ========================================
-- MIGRACIÓN: Agregar Soporte de Precios en ARS
-- ========================================
-- Fecha: 2026-01-11
-- Descripción: Agrega columnas para precios directos en pesos argentinos (ARS)
--              permitiendo productos con precios en USD o ARS

-- Paso 1: Agregar columnas de precios en ARS
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS precio_ars DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS precio_mayorista_ars DECIMAL(10,2);

-- Paso 2: Crear índice para consultas de rango de precios
CREATE INDEX IF NOT EXISTS idx_productos_precio_ars ON productos(precio_ars) WHERE precio_ars IS NOT NULL;

-- Paso 3: Agregar comentarios para documentación
COMMENT ON COLUMN productos.precio_ars IS 'Precio directo en pesos argentinos (ARS). Si existe, se muestra en lugar de convertir desde USD.';
COMMENT ON COLUMN productos.precio_mayorista_ars IS 'Precio mayorista en pesos argentinos (ARS). Alternativa a precio_mayorista_usd.';

-- Paso 4: Verificar la migración
-- Listar las columnas agregadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name IN ('precio_ars', 'precio_mayorista_ars');

-- ========================================
-- NOTAS DE USO:
-- ========================================
-- 1. Productos con precio_usd: Se muestra USD + ARS convertido (usando dolarapi.com)
-- 2. Productos SOLO con precio_ars: Se muestra únicamente ARS (sin conversión)
-- 3. Al menos UNO de los dos precios debe existir (validación en frontend)
-- 4. El precio_mayorista sigue la misma lógica (USD o ARS)
