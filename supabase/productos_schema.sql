-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_usd DECIMAL(10,2) NOT NULL,
  precio_mayorista_usd DECIMAL(10,2),
  cantidad_minima_mayorista INTEGER DEFAULT 1,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política: cualquiera puede leer productos activos
CREATE POLICY "Public can read active products" ON productos
  FOR SELECT
  USING (activo = true);

-- Política: solo usuarios autenticados pueden insertar/actualizar/eliminar
CREATE POLICY "Authenticated users can manage products" ON productos
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Crear bucket de storage para imágenes de productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos-imagenes', 'productos-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: cualquiera puede leer
CREATE POLICY "Public can read product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'productos-imagenes');

-- Política de storage: solo autenticados pueden subir
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'productos-imagenes' AND auth.role() = 'authenticated');

-- Política de storage: solo autenticados pueden actualizar
CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'productos-imagenes' AND auth.role() = 'authenticated');

-- Política de storage: solo autenticados pueden eliminar
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'productos-imagenes' AND auth.role() = 'authenticated');
