import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getDolarBlue, getDolarOficial } from '../services/exchangeRateService';

/**
 * Hook personalizado para gestionar el tipo de cambio
 * Permite alternar entre dólar blue, oficial, o manual
 */
export function useExchangeRate() {
    const [rateConfig, setRateConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar configuración actual del tipo de cambio
    const loadConfig = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('exchange_rates_config')
                .select('*')
                .eq('is_active', true)
                .single();

            if (error) throw error;
            setRateConfig(data);
        } catch (err) {
            console.error('Error cargando configuración de tipo de cambio:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Actualizar tipo de cambio desde API (blue u oficial)
    const updateFromAPI = async (rateType) => {
        try {
            let apiData;
            if (rateType === 'blue') {
                apiData = await getDolarBlue();
            } else if (rateType === 'oficial') {
                apiData = await getDolarOficial();
            } else {
                throw new Error('Tipo de cambio inválido');
            }

            // Desactivar todos los demás
            await supabase
                .from('exchange_rates_config')
                .update({ is_active: false })
                .neq('rate_type', rateType);

            // Upsert el nuevo valor
            const { data, error } = await supabase
                .from('exchange_rates_config')
                .upsert({
                    rate_type: rateType,
                    rate_value: apiData.promedio,
                    api_source: 'dolarapi.com',
                    last_api_update: new Date().toISOString(),
                    is_active: true
                }, { onConflict: 'rate_type' })
                .select()
                .single();

            if (error) throw error;
            setRateConfig(data);
            return data;
        } catch (err) {
            console.error('Error actualizando desde API:', err);
            throw err;
        }
    };

    // Establecer tipo de cambio manual
    const setManualRate = async (value) => {
        try {
            // Desactivar todos los demás
            await supabase
                .from('exchange_rates_config')
                .update({ is_active: false })
                .neq('rate_type', 'manual');

            // Upsert el valor manual
            const { data, error } = await supabase
                .from('exchange_rates_config')
                .upsert({
                    rate_type: 'manual',
                    rate_value: value,
                    is_active: true
                }, { onConflict: 'rate_type' })
                .select()
                .single();

            if (error) throw error;
            setRateConfig(data);
            return data;
        } catch (err) {
            console.error('Error estableciendo tipo de cambio manual:', err);
            throw err;
        }
    };

    // Obtener tipo de cambio actual (valor numérico)
    const getCurrentRate = () => {
        return rateConfig?.rate_value || 0;
    };

    useEffect(() => {
        loadConfig();
    }, []);

    return {
        rateConfig,
        loading,
        error,
        updateFromAPI,
        setManualRate,
        getCurrentRate,
        reload: loadConfig
    };
}
