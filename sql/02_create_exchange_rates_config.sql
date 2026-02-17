-- ==============================================================================
-- MIGRACIÓN 2: Tabla de Configuración de Tipo de Cambio
-- ==============================================================================
-- Descripción: Almacena configuración de tipo de cambio para conversión ARS/USD
--              Permite elegir entre dólar blue, oficial, o manual
-- ==============================================================================

-- 1. Crear tabla exchange_rates_config
CREATE TABLE IF NOT EXISTS exchange_rates_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de cambio
  rate_type TEXT CHECK (rate_type IN ('blue', 'oficial', 'manual')) NOT NULL,
  rate_value NUMERIC NOT NULL,               -- Valor del tipo de cambio (ej: 1450.00)
  
  -- Datos de la API (si aplica)
  api_source TEXT,                           -- URL o nombre de la API usada
  last_api_update TIMESTAMPTZ,               -- Última actualización desde API
  
  -- Metadatos
  is_active BOOLEAN DEFAULT FALSE,           -- Solo uno puede estar activo
  updated_by TEXT,                           -- Usuario que actualizó
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice para búsqueda rápida del tipo activo
CREATE INDEX IF NOT EXISTS idx_exchange_active ON exchange_rates_config(is_active) WHERE is_active = TRUE;

-- 3. Trigger para asegurar solo un tipo activo a la vez
CREATE OR REPLACE FUNCTION ensure_single_active_exchange_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    -- Desactivar todos los demás
    UPDATE exchange_rates_config 
    SET is_active = FALSE 
    WHERE id != NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_exchange
BEFORE INSERT OR UPDATE OF is_active ON exchange_rates_config
FOR EACH ROW
WHEN (NEW.is_active = TRUE)
EXECUTE FUNCTION ensure_single_active_exchange_rate();

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_exchange_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exchange_timestamp
BEFORE UPDATE ON exchange_rates_config
FOR EACH ROW
EXECUTE FUNCTION update_exchange_updated_at();

-- 5. Habilitar RLS
ALTER TABLE exchange_rates_config ENABLE ROW LEVEL SECURITY;

-- 6. Política de acceso
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON exchange_rates_config;
CREATE POLICY "Enable all access for authenticated users"
ON exchange_rates_config FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Insertar configuración por defecto (manual en 0)
INSERT INTO exchange_rates_config (rate_type, rate_value, is_active)
VALUES ('manual', 0, TRUE)
ON CONFLICT DO NOTHING;

-- 8. Comentarios
COMMENT ON TABLE exchange_rates_config IS 'Configuración de tipo de cambio ARS/USD';
COMMENT ON COLUMN exchange_rates_config.is_active IS 'Solo un tipo de cambio puede estar activo a la vez';

-- ==============================================================================
-- FIN DE MIGRACIÓN 2
-- ==============================================================================
