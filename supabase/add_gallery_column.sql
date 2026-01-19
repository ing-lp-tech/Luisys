-- Add galeria column to productos table
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS galeria TEXT[] DEFAULT '{}';

COMMENT ON COLUMN productos.galeria IS 'Array de URLs de imágenes del producto';
