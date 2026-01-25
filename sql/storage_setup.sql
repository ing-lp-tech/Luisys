-- ==============================================================================
-- CONFIGURACIÓN DE STORAGE (ARCHIVOS DE CONTRATOS)
-- ==============================================================================

-- 1. Crear el bucket 'sales-contracts' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-contracts', 'sales-contracts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Permitir subida publica" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura publica" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update publico" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete publico" ON storage.objects;

-- 3. Crear políticas permisivas (Permite subir/ver archivos a cualquier usuario autenticado o anon, según config de tu app)
-- NOTA: Ajustamos para que 'service_role', 'authenticated' y 'anon' puedan operar.

-- Política de INSERT (Subir archivos)
CREATE POLICY "Permitir subida total"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'sales-contracts' );

-- Política de SELECT (Ver archivos)
CREATE POLICY "Permitir lectura total"
ON storage.objects FOR SELECT
USING ( bucket_id = 'sales-contracts' );

-- Política de UPDATE (Modificar archivos)
CREATE POLICY "Permitir edicion total"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'sales-contracts' );

-- Política de DELETE (Borrar archivos)
CREATE POLICY "Permitir borrado total"
ON storage.objects FOR DELETE
USING ( bucket_id = 'sales-contracts' );

-- 4. Asegurar que RLS esté activo (aunque las policies lo controlan)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Confirmar
SELECT 'Storage configurado correctamente' as status;
