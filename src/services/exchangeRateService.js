/**
 * Servicio para obtener cotizaciones del dólar (blue y oficial)
 * API: https://dolarapi.com
 */

const DOLAR_API_BASE = 'https://dolarapi.com/v1/dolares';

/**
 * Obtiene la cotización del dólar blue
 * @returns {Promise<{compra: number, venta: number, fecha: string}>}
 */
export async function getDolarBlue() {
    try {
        const response = await fetch(`${DOLAR_API_BASE}/blue`);
        if (!response.ok) throw new Error('Error al obtener cotización blue');

        const data = await response.json();
        return {
            compra: data.compra,
            venta: data.venta,
            fecha: data.fechaActualizacion,
            promedio: (data.compra + data.venta) / 2
        };
    } catch (error) {
        console.error('Error obteniendo dólar blue:', error);
        throw error;
    }
}

/**
 * Obtiene la cotización del dólar oficial
 * @returns {Promise<{compra: number, venta: number, fecha: string}>}
 */
export async function getDolarOficial() {
    try {
        const response = await fetch(`${DOLAR_API_BASE}/oficial`);
        if (!response.ok) throw new Error('Error al obtener cotización oficial');

        const data = await response.json();
        return {
            compra: data.compra,
            venta: data.venta,
            fecha: data.fechaActualizacion,
            promedio: (data.compra + data.venta) / 2
        };
    } catch (error) {
        console.error('Error obteniendo dólar oficial:', error);
        throw error;
    }
}

/**
 * Obtiene todas las cotizaciones disponibles
 * @returns {Promise<Array>}
 */
export async function getAllDolarRates() {
    try {
        const response = await fetch(DOLAR_API_BASE);
        if (!response.ok) throw new Error('Error al obtener cotizaciones');

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo cotizaciones:', error);
        throw error;
    }
}

/**
 * Convierte un monto de USD a ARS usando el tipo de cambio especificado
 * @param {number} amountUSD - Monto en USD
 * @param {number} exchangeRate - Tipo de cambio
 * @returns {number} - Monto en ARS
 */
export function convertUSDtoARS(amountUSD, exchangeRate) {
    if (!amountUSD || !exchangeRate) return 0;
    return Number((amountUSD * exchangeRate).toFixed(2));
}

/**
 * Convierte un monto de ARS a USD usando el tipo de cambio especificado
 * @param {number} amountARS - Monto en ARS
 * @param {number} exchangeRate - Tipo de cambio
 * @returns {number} - Monto en USD
 */
export function convertARStoUSD(amountARS, exchangeRate) {
    if (!amountARS || !exchangeRate) return 0;
    return Number((amountARS / exchangeRate).toFixed(2));
}
