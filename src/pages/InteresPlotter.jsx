import { useEffect, useState } from 'react';
import { trackContact } from '../services/tiktokTracking';

/**
 * Landing Page para TikTok Ads
 * 
 * Esta página trackea el evento "Contact" en TikTok y redirige automáticamente
 * a WhatsApp con un mensaje pre-llenado sobre Plotters de Tizada.
 * 
 * Flujo:
 * 1. Usuario hace clic en anuncio de TikTok
 * 2. Llega a esta página (/interes-plotter)
 * 3. Se trackea el evento Contact
 * 4. Después de 400ms se redirige a WhatsApp
 */
const InteresPlotter = () => {
    const [redirecting, setRedirecting] = useState(true);

    useEffect(() => {
        // Función async para manejar el tracking y redirección
        const handleRedirect = async () => {
            console.log('[TikTok Landing] Usuario llegó desde TikTok Ads');

            // 1. Trackear el evento Contact en TikTok
            await trackContact();
            console.log('[TikTok Landing] Evento Contact enviado');

            // 2. Esperar 400ms para asegurar que el pixel se dispare
            await new Promise(resolve => setTimeout(resolve, 400));

            // 3. Mensaje pre-llenado para WhatsApp
            const mensaje = `¡Hola! Vi tu anuncio en TikTok sobre el Plotter de Tizada. Me gustaría recibir más información sobre:

- Precio y formas de pago
- Tiempos de entrega
- Garantía y soporte técnico

¡Gracias!`;

            // Número de WhatsApp (el mismo que tienes en CartPage.jsx)
            const numeroWhatsApp = '5491162021005';

            // 4. Construir URL de WhatsApp
            const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

            console.log('[TikTok Landing] Redirigiendo a WhatsApp...');

            // 5. Redirigir
            window.location.href = whatsappUrl;
        };

        handleRedirect();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                {/* Logo o Icono */}
                <div className="mb-6">
                    <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Título */}
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    ¡Excelente elección! 🎉
                </h1>

                {/* Mensaje */}
                <p className="text-gray-600 mb-6">
                    Te estamos redirigiendo a WhatsApp para brindarte atención personalizada sobre nuestros Plotters de Tizada...
                </p>

                {/* Spinner de carga */}
                <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>

                {/* Texto secundario */}
                <p className="text-sm text-gray-500">
                    Si no se abre automáticamente,
                    <a
                        href={`https://wa.me/5491162021005?text=${encodeURIComponent('¡Hola! Vi tu anuncio en TikTok sobre el Plotter de Tizada. Me gustaría recibir más información.')}`}
                        className="text-green-600 hover:text-green-700 font-medium ml-1"
                    >
                        haz clic aquí
                    </a>
                </p>

                {/* Información adicional */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400">
                        🔒 Tu privacidad es importante. Esta redirección es segura.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InteresPlotter;
