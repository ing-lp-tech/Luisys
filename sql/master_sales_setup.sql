-- ==============================================================================
-- MASTER SCRIPT: CONFIGURACIÓN COMPLETA MÓDULO DE VENTAS (CLEAN VERSION)
-- ==============================================================================
-- Ejecutar este script completo en el Editor SQL de Supabase del proyecto CORRECTO.
-- ID del Proyecto esperado: uwtqrujdvpjrlllmffif
-- ==============================================================================

-- 1. CREACIÓN DE TABLA Y COLUMNA COST_ARS
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references productos(id) on delete cascade not null,
  serial_number text not null,
  model_variant text, 
  cost_usd numeric,
  cost_ars numeric, -- Costo en pesos
  purchase_date date default current_date,
  status text check (status in ('available', 'sold')) default 'available',
  sale_date date,
  client_name text,
  sale_price_usd numeric, 
  sale_price_ars numeric, 
  contract_files text[], 
  created_at timestamptz default now(),
  UNIQUE(product_id, serial_number) -- EVITAR DUPLICADOS
);

-- Asegurar columna (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='cost_ars') THEN
        ALTER TABLE inventory_items ADD COLUMN cost_ars numeric;
    END IF;
END $$;

-- RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON inventory_items;
CREATE POLICY "Enable all access for authenticated users" ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('sales-contracts', 'sales-contracts', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'sales-contracts' );
DROP POLICY IF EXISTS "Authenticated Export" ON storage.objects;
CREATE POLICY "Authenticated Export" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'sales-contracts' );
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'sales-contracts' );

-- 3. FUNCIONES (CLEAN NAMES - NO V2)
-- Borramos todo rastro de versiones viejas o duplicadas para limpiar
DROP FUNCTION IF EXISTS get_inventory_v2();
DROP FUNCTION IF EXISTS register_entry_v2(uuid, text, text, numeric, date);
DROP FUNCTION IF EXISTS register_entry_v2(uuid, text, text, numeric, numeric, date);
-- Borramos versiones v1 anteriores si existen
DROP FUNCTION IF EXISTS get_inventory();
DROP FUNCTION IF EXISTS register_entry(uuid, text, text, numeric, numeric, date);

-- FUNCIÓN DE LECTURA: get_inventory
CREATE OR REPLACE FUNCTION get_inventory()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  serial_number text,
  model_variant text,
  cost_usd numeric,
  cost_ars numeric,
  purchase_date date,
  status text,
  sale_date date,
  client_name text,
  sale_price_usd numeric,
  sale_price_ars numeric,
  contract_files text[],
  created_at timestamptz,
  product_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.product_id,
    i.serial_number,
    i.model_variant,
    i.cost_usd,
    i.cost_ars,
    i.purchase_date,
    i.status,
    i.sale_date,
    i.client_name,
    i.sale_price_usd,
    i.sale_price_ars,
    i.contract_files,
    i.created_at,
    p.nombre as product_name
  FROM inventory_items i
  LEFT JOIN productos p ON i.product_id = p.id
  ORDER BY i.created_at DESC;
END;
$$;

-- FUNCIÓN DE ESCRITURA: register_entry
CREATE OR REPLACE FUNCTION register_entry(
  p_product_id uuid,
  p_serial_number text,
  p_model_variant text,
  p_cost_usd numeric,
  p_cost_ars numeric,
  p_purchase_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO inventory_items (
    product_id,
    serial_number,
    model_variant,
    cost_usd,
    cost_ars,
    purchase_date,
    status
  ) VALUES (
    p_product_id,
    p_serial_number,
    p_model_variant,
    p_cost_usd,
    p_cost_ars,
    p_purchase_date,
    'available'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 4. PERMISOS Y CACHÉ
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE inventory_items TO authenticated;
GRANT ALL ON TABLE inventory_items TO service_role;
GRANT EXECUTE ON FUNCTION get_inventory() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION register_entry(uuid, text, text, numeric, numeric, date) TO authenticated, service_role, anon;

NOTIFY pgrst, 'reload config';
