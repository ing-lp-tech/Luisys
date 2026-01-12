-- Script SQL para configurar Supabase
-- Ejecuta esto en el Editor SQL de Supabase

-- 1. Crear la tabla para almacenar vectores
CREATE TABLE IF NOT EXISTS manual_audaces (
  id bigserial PRIMARY KEY,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- 2. Crear índice para búsquedas rápidas (requiere extensión pgvector)
CREATE INDEX IF NOT EXISTS manual_audaces_embedding_idx 
ON manual_audaces 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE manual_audaces ENABLE ROW LEVEL SECURITY;

-- 4. Crear política para permitir inserciones (ajusta según tus necesidades)
CREATE POLICY "Allow all inserts" 
ON manual_audaces 
FOR INSERT 
WITH CHECK (true);

-- 5. Crear política para permitir lecturas
CREATE POLICY "Allow all reads" 
ON manual_audaces 
FOR SELECT 
USING (true);

-- 6. Verificar que la extensión pgvector esté habilitada
-- (Debería estar habilitada por defecto en Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 7. Verificar la tabla
SELECT * FROM manual_audaces LIMIT 5;
