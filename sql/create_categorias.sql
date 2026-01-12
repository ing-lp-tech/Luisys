-- ============================================
-- MIGRACIÓN: Sistema de Categorías Dinámicas
-- ============================================
-- Ejecuta este script en tu Supabase SQL Editor

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_categorias_orden ON public.categorias(orden);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON public.categorias(activo);

-- 3. Habilitar RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Permitir lectura a todos (solo categorías activas)
DROP POLICY IF EXISTS "Categorías visibles para todos" ON public.categorias;
CREATE POLICY "Categorías visibles para todos" ON public.categorias
    FOR SELECT USING (activo = true);

-- Permitir todas las operaciones a usuarios autenticados
DROP POLICY IF EXISTS "Solo autenticados pueden modificar categorías" ON public.categorias;
CREATE POLICY "Solo autenticados pueden modificar categorías" ON public.categorias
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Insertar categorías por defecto
INSERT INTO public.categorias (nombre, descripcion, orden) VALUES
    ('Plotters inyección', 'Plotters profesionales de inyección de tinta para tizado digital de alta velocidad', 1),
    ('Plotters corte', 'Plotters multifunción para tizado con lapicera y corte de vinilo', 2),
    ('Papel marrón', 'Papel kraft para tizado de patrones de confección', 3),
    ('Papel blanco', 'Papel blanco profesional para tizado técnico y presentaciones', 4),
    ('Computadoras', 'PCs optimizadas para software de diseño textil', 5),
    ('Seguridad', 'Sistemas de video vigilancia y cámaras de seguridad', 6)
ON CONFLICT (nombre) DO NOTHING;

-- 6. Eliminar columna "tipo" de la tabla productos (si existe)
ALTER TABLE public.productos DROP COLUMN IF EXISTS tipo;

-- 7. Agregar relación con categorías (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'categoria_id'
    ) THEN
        ALTER TABLE public.productos ADD COLUMN categoria_id UUID REFERENCES public.categorias(id);
    END IF;
END $$;

-- 8. Migrar datos existentes: asociar productos con categorías
UPDATE public.productos p
SET categoria_id = c.id
FROM public.categorias c
WHERE p.categoria = c.nombre;

-- 9. Crear índice en productos
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos(categoria_id);

-- ✅ LISTO! Ahora puedes gestionar categorías desde el admin panel
