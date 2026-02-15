/**
 * TikTok Pixel Tracking Service
 * 
 * Servicio centralizado para trackear eventos de conversión en TikTok Ads.
 * Todos los eventos se envían al pixel D68SMH3C77U42FK02DGG.
 */

/**
 * Verifica si el TikTok Pixel está cargado
 * @returns {boolean}
 */
const isTikTokPixelLoaded = () => {
    return typeof window !== 'undefined' && typeof window.ttq !== 'undefined';
};

/**
 * Trackea cuando un usuario ve un producto
 * @param {Object} product - Objeto del producto con id, nombre, precio, etc.
 */
export const trackViewContent = (product) => {
    if (!isTikTokPixelLoaded()) {
        console.warn('[TikTok Pixel] ttq no está disponible aún');
        return;
    }

    try {
        const price = product.precio_usd || product.precio_ars || product.price || 0;

        window.ttq.track('ViewContent', {
            contents: [
                {
                    content_id: String(product.id),
                    content_type: 'product',
                    content_name: product.nombre || product.name || 'Producto'
                }
            ],
            value: parseFloat(price),
            currency: product.precio_usd ? 'USD' : 'ARS'
        });

        console.log('[TikTok Pixel] ViewContent tracked:', {
            product: product.nombre || product.name,
            price,
            id: product.id
        });
    } catch (error) {
        console.error('[TikTok Pixel] Error tracking ViewContent:', error);
    }
};

/**
 * Trackea cuando un usuario agrega un producto al carrito
 * @param {Object} product - Objeto del producto
 * @param {number} quantity - Cantidad agregada
 * @param {number} price - Precio total (precio unitario * cantidad)
 */
export const trackAddToCart = (product, quantity = 1, price) => {
    if (!isTikTokPixelLoaded()) {
        console.warn('[TikTok Pixel] ttq no está disponible aún');
        return;
    }

    try {
        window.ttq.track('AddToCart', {
            contents: [
                {
                    content_id: String(product.id),
                    content_type: 'product',
                    content_name: product.nombre || product.name || 'Producto'
                }
            ],
            value: parseFloat(price),
            currency: 'ARS'
        });

        console.log('[TikTok Pixel] AddToCart tracked:', {
            product: product.nombre || product.name,
            quantity,
            price
        });
    } catch (error) {
        console.error('[TikTok Pixel] Error tracking AddToCart:', error);
    }
};

/**
 * Trackea cuando un usuario inicia el proceso de checkout
 * @param {Array} cart - Array de productos en el carrito
 * @param {number} total - Valor total del carrito
 */
export const trackInitiateCheckout = (cart, total) => {
    if (!isTikTokPixelLoaded()) {
        console.warn('[TikTok Pixel] ttq no está disponible aún');
        return;
    }

    try {
        const contents = cart.map(item => ({
            content_id: String(item.id),
            content_type: 'product',
            content_name: item.name || item.nombre || 'Producto'
        }));

        window.ttq.track('InitiateCheckout', {
            contents,
            value: parseFloat(total),
            currency: 'ARS'
        });

        console.log('[TikTok Pixel] InitiateCheckout tracked:', {
            items: cart.length,
            total
        });
    } catch (error) {
        console.error('[TikTok Pixel] Error tracking InitiateCheckout:', error);
    }
};

/**
 * Trackea cuando un usuario hace contacto
 * Este es el evento principal para campañas de generación de leads
 * @returns {Promise<boolean>} Promesa que resuelve true cuando el evento se registró
 */
export const trackContact = () => {
    return new Promise((resolve) => {
        if (!isTikTokPixelLoaded()) {
            console.warn('[TikTok Pixel] ttq no está disponible aún');
            resolve(false);
            return;
        }

        try {
            window.ttq.track('Contact');

            console.log('[TikTok Pixel] Contact tracked');

            // Esperar un poco para asegurar que el evento se envíe
            setTimeout(() => {
                resolve(true);
            }, 100);
        } catch (error) {
            console.error('[TikTok Pixel] Error tracking Contact:', error);
            resolve(false);
        }
    });
};

/**
 * Trackea una compra completada (para uso futuro)
 * @param {Array} cart - Array de productos comprados
 * @param {number} total - Valor total de la compra
 * @param {string} orderId - ID único del pedido
 */
export const trackPurchase = (cart, total, orderId = '') => {
    if (!isTikTokPixelLoaded()) {
        console.warn('[TikTok Pixel] ttq no está disponible aún');
        return;
    }

    try {
        const contents = cart.map(item => ({
            content_id: String(item.id),
            content_type: 'product',
            content_name: item.name || item.nombre || 'Producto'
        }));

        window.ttq.track('Purchase', {
            contents,
            value: parseFloat(total),
            currency: 'ARS'
        });

        console.log('[TikTok Pixel] Purchase tracked:', {
            orderId,
            items: cart.length,
            total
        });
    } catch (error) {
        console.error('[TikTok Pixel] Error tracking Purchase:', error);
    }
};
