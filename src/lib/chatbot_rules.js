// ========================================================================
// CHATBOT HÍBRIDO PROFESIONAL - Ventas Optimizadas con Mínimo Uso de IA
// Ahorr: 90-99% de tokens de OpenAI
// ========================================================================

export const CHATBOT_RULES = {
    // Catálogo de productos con características de venta
    products: {
        plotters_inyeccion: [
            {
                id: 1,
                name: 'HP45 190cm',
                price: 3800,
                badge: '⭐ MÁS VENDIDO',
                features: [
                    '✅ Velocidad profesional: 1m/min bidireccional',
                    '✅ Cabezal HP45: Ultra preciso',
                    '✅ Ahorra TIEMPO: 10x más rápido que a mano',
                    '✅ Elimina el cartón de tizada para siempre',
                    '💰 ROI en 3-6 meses'
                ]
            },
            {
                id: 2,
                name: 'EPSON 190cm',
                price: 3900,
                badge: '',
                features: [
                    '✅ Sistema continuo: Sin recargas constantes',
                    '✅ Tinta recargable: Menor costo operativo',
                    '✅ Ancho ideal: 190cm para mayoría de prendas',
                    '✅ Trazos nítidos y profesionales',
                    '💰 Ahorro en tinta: 40% vs cartuchos'
                ]
            },
            {
                id: 3,
                name: 'HP45 200cm',
                price: 4300,
                badge: '💎 PREMIUM',
                features: [
                    '✅ Gran formato: Moldes grandes sin problemas',
                    '✅ 200cm de ancho: Cualquier necesidad',
                    '✅ Doble velocidad bidireccional',
                    '✅ Ideal para fábricas grandes',
                    '💰 Productividad máxima'
                ]
            },
            {
                id: 4,
                name: 'EPSON 200cm',
                price: 4500,
                badge: '👑 TOP',
                features: [
                    '✅ Lo mejor de todo: Sistema continuo + 200cm',
                    '✅ Máxima productividad',
                    '✅ Menor costo operativo largo plazo',
                    '✅ Para producciones industriales',
                    '💰 Inversión que se paga sola'
                ]
            }
        ],
        plotters_corte: [
            {
                id: 1,
                name: '100cm',
                price: 850,
                badge: '💰 Económico',
                features: [
                    '✅ Corte de vinilo textil, transfer',
                    '✅ Ideal para emprendimientos',
                    '⚠️ Puede usarse para tizada pero NO es ideal',
                    '💡 Si es para ropa, mejor inyección'
                ]
            },
            {
                id: 2,
                name: '125cm',
                price: 1000,
                badge: '',
                features: [
                    '✅ Ancho mediano: Más versátil',
                    '✅ Corte preciso de vinilo',
                    '⚠️ Para tizada: Limitado vs inyección',
                    '💡 Mejor opción: Plotter inyección para textil'
                ]
            },
            {
                id: 3,
                name: '180cm',
                price: 1650,
                badge: '⭐ Recomendado',
                features: [
                    '✅ Ancho industrial: 180cm',
                    '✅ Multifunción: Vinilo + tizada básica',
                    '✅ Corte preciso y rápido',
                    '⚠️ Para producción de ropa, inyección es superior'
                ]
            }
        ]
    },

    // Patterns para clasificar intención
    patterns: {
        greetings: /^(hola|hey|buenos|buenas|holi|hi|ola)/i,
        comprar: /(comprar|compra|quiero|necesito|busco)/i,
        asistencia: /(asistencia|ayuda|problema|soporte|tecnico|técnico)/i,
        contacto: /(whatsapp|telefono|contacto|llamar|dueño|dueno|hablar)/i,
        precio: /(precio|cuanto|costo|vale)/i,
        descuento: /(descuento|rebaja|oferta|promocion|promoción|facilidad|financiacion|financiación)/i,
        gracias: /(gracias|thank|perfecto|genial|ok)/i,
        opcion_numero: /^[1-9]$/,
        si_no: /^(si|sí|no|nop)$/i,
    },

    // Número de WhatsApp
    whatsappNumber: '5491162020911',

    // ============================================================
    // FUNCIÓN PRINCIPAL: Responder sin IA cuando sea posible
    // ============================================================
    tryRespond(userMessage, conversationContext = {}) {
        const msg = userMessage.trim().toLowerCase();
        const lastMenu = conversationContext.lastMenu || '';
        const lastProduct = conversationContext.lastProduct || null;

        // ========== 1. SALUDO INICIAL ==========
        if (this.patterns.greetings.test(msg) && !lastMenu) {
            return {
                useAI: false,
                response: `¡Hola! 👋 Soy **IngeBot** de Electro Luisys.

¿En qué puedo ayudarte hoy?

1. 🛒 **Comprar Productos** (Plotters, Papel)

2. 🔧 **Asistencia Técnica**

3. 👤 **Hablar con el Dueño**

Responde con el número (1, 2 o 3)`,
                context: { lastMenu: 'main' }
            };
        }

        // ========== 2. MENÚ PRINCIPAL - OPCIÓN 1: COMPRAR ==========
        if (msg === '1' && lastMenu === 'main') {
            return {
                useAI: false,
                response: `🛒 **¿Qué estás buscando?**

1. 💎 **Plotter para Tizada Digital**
   (Inyección - Profesional - Sobre la tela)

2. ✂️ **Plotter de Corte de Vinilo**
   (También sirve para tizada básica)

3. 📄 **Papel para Tizada**

4. 🤔 **No estoy seguro, necesito asesoramiento**

¿Qué opción prefieres?`,
                context: { lastMenu: 'compra' }
            };
        }

        // ========== 3. MENÚ PRINCIPAL - OPCIÓN 2: ASISTENCIA ==========
        if (msg === '2' && lastMenu === 'main') {
            return {
                useAI: false,
                response: `🔧 **Asistencia Técnica**

¿Qué tipo de ayuda necesitas?

1. 🔴 **Problema con mi equipo**

2. ❓ **Consulta de uso / configuración**

3. 🛠️ **Mantenimiento / limpieza**

4. 💬 **Otro problema técnico**

Selecciona una opción (1-4)`,
                context: { lastMenu: 'asistencia' }
            };
        }

        // ========== 4. MENÚ PRINCIPAL - OPCIÓN 3: HABLAR CON DUEÑO ==========
        if (msg === '3' && lastMenu === 'main') {
            return {
                useAI: false,
                response: `👤 **Contacto Directo con el Dueño**

📱 WhatsApp: **${this.whatsappNumber}**
👉 [Click aquí para chatear](https://wa.me/${this.whatsappNumber}?text=Hola!%20Vengo%20de%20IngeBot)

Luis Patty - Dueño de Electro Luisys

Horario: Lun-Vie 9am-6pm

Te atenderá personalmente para cualquier consulta o cotización especial.

¿Necesitas algo más?`,
                context: { lastMenu: 'main' }
            };
        }

        // ========== 5. COMPRA - OPCIÓN 1: PLOTTERS TIZADA (INYECCIÓN) ==========
        if (msg === '1' && lastMenu === 'compra') {
            let response = `💎 **Plotters de INYECCIÓN para Tizada Digital**
Profesionales - Alta calidad - Ponen el molde sobre la tela\n\n`;

            this.products.plotters_inyeccion.forEach((p, i) => {
                response += `${i + 1}. **${p.name}** ${p.badge}\n   USD $${p.price.toLocaleString()}\n\n`;
            });

            response += `✅ **TODOS INCLUYEN:**
• Instalación profesional
• Capacitación completa
• Curso de Audaces (8 clases)
• Soporte permanente

¿Cuál te interesa? (1-4)`;

            return {
                useAI: false,
                response,
                context: { lastMenu: 'plotters_inyeccion' }
            };
        }

        // ========== 6. COMPRA - OPCIÓN 2: PLOTTERS CORTE (VINILO) ==========
        if (msg === '2' && lastMenu === 'compra') {
            let response = `✂️ **Plotters de CORTE para Vinilo**
⚠️ Pueden usarse para tizada pero NO es lo ideal\n\n`;

            this.products.plotters_corte.forEach((p, i) => {
                response += `${i + 1}. **${p.name}** ${p.badge}\n   USD $${p.price.toLocaleString()}\n\n`;
            });

            response += `💡 **IMPORTANTE:**
Si tu uso principal es para **ropa/textil**, te recomendamos los plotters de **INYECCIÓN** (opción anterior). Son mucho más eficientes para tizada.

¿Cuál prefieres? (1-3)
O escribe "volver" para ver plotters de inyección`;

            return {
                useAI: false,
                response,
                context: { lastMenu: 'plotters_corte' }
            };
        }

        // ========== 7. DETALLE DE PLOTTER INYECCIÓN ==========
        if (lastMenu === 'plotters_inyeccion' && /^[1-4]$/.test(msg)) {
            const idx = parseInt(msg) - 1;
            const plotter = this.products.plotters_inyeccion[idx];

            if (plotter) {
                let response = `**${plotter.name}** ${plotter.badge}
💵 USD $${plotter.price.toLocaleString()}\n\n`;

                response += plotter.features.join('\n') + '\n\n';

                response += `📦 **INCLUYE en el precio:**
• Instalación profesional en tu taller
• Capacitación de tu equipo
• Curso de Audaces (8 clases completas)
• Moldes digitales de regalo
• Soporte técnico permanente\n\n`;

                response += `💰 **¿Ya tienes experiencia?**
Si NO necesitas curso, instalación ni capacitación, puedes obtener **descuento especial**.\n\n`;

                response += `¿Qué prefieres?\n\n1. ✅ **Comprar con todo incluido**\n\n2. 💸 **Descuento** (sin curso/instalación/capacitación)\n\n3. 🔄 **Ver otros plotters**`;

                return {
                    useAI: false,
                    response,
                    context: { lastMenu: 'detalle_producto', lastProduct: plotter }
                };
            }
        }

        // ========== 8. DETALLE DE PLOTTER CORTE ==========
        if (lastMenu === 'plotters_corte' && /^[1-3]$/.test(msg)) {
            const idx = parseInt(msg) - 1;
            const plotter = this.products.plotters_corte[idx];

            if (plotter) {
                let response = `**${plotter.name}** ${plotter.badge}
💵 USD $${plotter.price.toLocaleString()}\n\n`;

                response += plotter.features.join('\n') + '\n\n';

                response += `📦 **INCLUYE:**
• Instalación y capacitación\n\n`;

                response += `💡 **Recordatorio:** Si necesitas el plotter principalmente para **tizada de ropa**, los plotters de **INYECCIÓN** son la mejor opción (más precisos y eficientes).\n\n`;

                response += `¿Qué prefieres?\n\n1. ✅ **Comprar este plotter de corte**\n\n2. 💎 **Ver plotters de inyección**\n\n3. 📞 **Hablar con vendedor**`;

                return {
                    useAI: false,
                    response,
                    context: { lastMenu: 'detalle_producto_corte', lastProduct: plotter }
                };
            }
        }

        // ========== 9. CIERRE DE VENTA ==========
        // Opción 1: Comprar con todo incluido
        if ((lastMenu === 'detalle_producto' || lastMenu === 'detalle_producto_corte') && msg === '1') {
            return {
                useAI: false,
                response: `🎉 **¡Perfecto! Compra con Pack Completo**

📱 Contáctanos por WhatsApp:
**${this.whatsappNumber}**
👉 [Click aquí para chatear](https://wa.me/${this.whatsappNumber}?text=Hola!%20Vengo%20de%20IngeBot%20-%20Quiero%20${conversationContext.lastProduct?.name || 'información'}%20con%20instalación)

Horario: Lun-Vie 9am-6pm

¿Necesitas algo más?`,
                context: { lastMenu: 'main' }
            };
        }

        // Opción 2: Descuentos y Facilidades (COMBINADAS)
        if ((lastMenu === 'detalle_producto' || lastMenu === 'detalle_producto_corte') && msg === '2') {
            const productName = conversationContext.lastProduct?.name || 'el producto que te interesa';
            const whatsappLink = `https://wa.me/${this.whatsappNumber}?text=Hola!%20Vengo%20de%20IngeBot.%20Me%20interesa%20${encodeURIComponent(productName)}%20sin%20extras`;

            return {
                useAI: false,
                response: `💸 **Descuentos / Facilidades de Pago** 📞

¡Perfecto! Opciones disponibles:

**Para clientes con experiencia:**
• Descuentos por contado
• Combos especiales

📱 **Contacto directo con el dueño:**
👉 [Click aquí para WhatsApp](${whatsappLink})

O escribe al: **${this.whatsappNumber}**

¿Necesitas algo más?`,
                context: { lastMenu: 'main' }
            };
        }

        // Opción 3: Ver otros plotters
        if ((lastMenu === 'detalle_producto' || lastMenu === 'detalle_producto_corte') && msg === '3') {
            return {
                useAI: false,
                response: `🔄 **Volver a Productos**

¿Qué quieres ver?

1. 💎 **Plotters de Inyección** (Tizada Digital)

2. ✂️ **Plotters de Corte** (Vinilo)

3. 📄 **Papel para Tizada**

4. 🏠 **Menú Principal**`,
                context: { lastMenu: 'compra' }
            };
        }

        // ========== 10. ASISTENCIA TÉCNICA - DERIVAR A IA ==========
        if (lastMenu === 'asistencia' && /^[1-4]$/.test(msg)) {
            return {
                useAI: true, // Soporte técnico necesita IA
                systemPrompt: 'Eres un técnico experto en plotters de tizada. Ayuda a diagnosticar problemas. Sé breve y directo.',
                reason: 'Soporte técnico requiere análisis personalizado'
            };
        }

        // ========== 11. ASESORAMIENTO PERSONALIZADO ==========
        if (msg === '4' && lastMenu === 'compra') {
            return {
                useAI: true, // Asesoramiento personalizado
                systemPrompt: `Eres un asesor de ventas experto en plotters para textil. 
Pregunta sobre: tamaño del taller, producción mensual, tipos de prendas.
Recomienda el plotter ideal basándote en necesidades.
Siempre menciona que incluyen instalación + curso.
Termina con: "WhatsApp: ${this.whatsappNumber}"
Máximo 3 líneas.`,
                reason: 'Asesoramiento personalizado requiere análisis'
            };
        }

        // ========== 12. DESCUENTOS / FACILIDADES (DIRECTO) ==========
        if (this.patterns.descuento.test(msg)) {
            const whatsappLink = `https://wa.me/${this.whatsappNumber}?text=Hola!%20Vengo%20de%20IngeBot.%20Consulta%20sobre%20descuentos`;

            return {
                useAI: false,
                response: `💸 **¡Claro! Hablemos de descuentos**

👉 Opciones disponibles:
• Descuentos por pago contado
• Facilidades de pago
• Promociones especiales
• Combos con descuento

📱 **Contacto directo con el dueño:**
👉 [Click aquí para WhatsApp](${whatsappLink})

O escribe al: **${this.whatsappNumber}**

¿Necesitas algo más?`,
                context: { lastMenu: 'main' }
            };
        }

        // ========== 13. VOLVER AL MENÚ ==========
        if (/(volver|menu|inicio|atras|atrás)/i.test(msg)) {
            return {
                useAI: false,
                response: `🏠 **Menú Principal**

¿En qué puedo ayudarte?

1. 🛒 **Comprar Productos**

2. 🔧 **Asistencia Técnica**

3. 👤 **Hablar con el Dueño**

Elige una opción (1-3)`,
                context: { lastMenu: 'main' }
            };
        }

        // ========== 13. CONTACTO/WHATSAPP ==========
        if (this.patterns.contacto.test(msg)) {
            return {
                useAI: false,
                response: `📱 **Contacto**

WhatsApp: **${this.whatsappNumber}**
👉 [Click aquí para chatear](https://wa.me/${this.whatsappNumber}?text=Hola!%20Vengo%20de%20IngeBot)

Luis Patty - Dueño
Horario: Lun-Vie 9am-6pm

Te atenderemos personalmente.

¿Necesitas algo más?`,
                context: { lastMenu: 'main' }
            };
        }

        // ========== 14. GRACIAS ==========
        if (this.patterns.gracias.test(msg)) {
            return {
                useAI: false,
                response: `¡De nada! 😊 Fue un placer ayudarte.

Si necesitas algo más, escribe "hola" o contáctanos:
📱 WhatsApp: **${this.whatsappNumber}**

¡Éxitos con tu taller!`,
                context: {}
            };
        }

        // ========== 15. NO SE PUEDE RESPONDER SIN IA ==========
        return {
            useAI: true,
            systemPrompt: `Eres IngeBot, vendedor de Electro Luisys. Vendes plotters de tizada y papel.
Responde en máximo 2 líneas. Sé directo.
Si preguntan por productos, dirige al menú (escribe "hola").
WhatsApp para consultas: ${this.whatsappNumber}`,
            reason: 'Consulta que no coincide con patrones predefinidos'
        };
    }
};

export default CHATBOT_RULES;
