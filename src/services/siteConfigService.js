import { supabase } from '../lib/supabaseClient';

export const siteConfigService = {
    // Obtener una configuración por su clave
    async getConfig(key) {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('value')
                .eq('key', key)
                .single();

            if (error) throw error;
            return data?.value || null;
        } catch (error) {
            console.error(`Error fetching config for key ${key}:`, error);
            return null;
        }
    },

    // Obtener todas las configuraciones (útil para cargar todo de una vez)
    async getAllConfigs() {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('*');

            if (error) throw error;

            // Convertir array a objeto para fácil acceso { key: value }
            const configMap = {};
            data.forEach(item => {
                configMap[item.key] = item.value;
            });

            return configMap;
        } catch (error) {
            console.error('Error fetching all configs:', error);
            return {};
        }
    },

    // Actualizar una configuración (Solo Admin)
    async updateConfig(key, value) {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .update({ value, updated_at: new Date() })
                .eq('key', key)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error updating config for key ${key}:`, error);
            throw error;
        }
    },

    // Subir imagen al bucket 'site-assets'
    async uploadImage(file, path) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${path}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
};
