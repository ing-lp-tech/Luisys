-- ==============================================================================
-- MIGRACIÓN 6: Corrección - Agregar UNIQUE constraint a exchange_rates_config
-- ==============================================================================
-- Descripción: Agrega constraint UNIQUE a rate_type para permitir upsert
-- ==============================================================================

-- 1. Agregar constraint UNIQUE a rate_type
ALTER TABLE exchange_rates_config
ADD CONSTRAINT exchange_rates_config_rate_type_key UNIQUE (rate_type);

-- 2. Comentario
COMMENT ON CONSTRAINT exchange_rates_config_rate_type_key ON exchange_rates_config 
IS 'Garantiza que solo exista un registro por tipo de cambio (blue/oficial/manual)';

-- ==============================================================================
-- FIN DE MIGRACIÓN 6
-- ==============================================================================
