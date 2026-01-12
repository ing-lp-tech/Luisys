-- ========================================
-- CORRECCIÓN: Hacer precio_usd opcional
-- ========================================
-- Fecha: 2026-01-11
-- Descripción: Elimina la restricción NOT NULL de la columna precio_usd
--              para permitir guardar productos solo con precio en ARS.

ALTER TABLE productos ALTER COLUMN precio_usd DROP NOT NULL;

-- Verificación (Opcional)
-- SELECT column_name, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'productos' AND column_name = 'precio_usd';
