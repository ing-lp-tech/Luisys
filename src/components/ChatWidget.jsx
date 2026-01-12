/* ========================================
 * ARCHIVO DESACTIVADO - NO SE USA
 * ========================================
 * Este componente fue desactivado porque:
 * 1. No se utiliza en la aplicación actual
 * 2. Es un widget de chat genérico que fue reemplazado por ChatVendedor y ChatAudacesWidget
 * 3. Requiere configuración de webhook que no está implementada
 * 
 * Para reactivar:
 * 1. Configurar el WEBHOOK_URL en línea 18
 * 2. Importar y usar en algún componente de la app
 * ========================================
 */

/* import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "¡Hola! Soy AudacesExpert Pro. ¿En qué puedo ayudarte hoy con Audaces 7?",
            sender: "bot",
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // IMPORTANTE: Reemplaza esta URL con tu Webhook de Producción de n8n
    const WEBHOOK_URL = "TU_WEBHOOK_URL_AQUI";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputText,
            sender: "user",
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            if (WEBHOOK_URL === "TU_WEBHOOK_URL_AQUI") {
                // Simulación si no hay webhook configurado
                setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now() + 1,
                            text: "⚠️ Configura tu Webhook de n8n en ChatWidget.jsx para recibir respuestas reales.",
                            sender: "bot",
                        },
                    ]);
                    setIsLoading(false);
                }, 1000);
                return;
            }

            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage.text }),
            });

            const data = await response.json();

            // Asumimos que n8n devuelve { output: "Respuesta..." } o { response: "Respuesta..." }
            const botResponseText = data.output || data.response || "No pude procesar tu solicitud.";

            const botMessage = {
                id: Date.now() + 1,
                text: botResponseText,
                sender: "bot",
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "Lo siento, hubo un error al conectar con el servidor.",
                    sender: "bot",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center shadow-md">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-lg">Soporte Técnico</h3>
                            <span className="text-xs text-blue-100 opacity-90">Audaces 7 Expert</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Cerrar chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white text-gray-700 border border-gray-200 rounded-bl-none"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex items-center space-x-2">
                                    <Loader2 size={16} className="animate-spin text-blue-600" />
                                    <span className="text-xs text-gray-500">Escribiendo...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Escribe tu consulta sobre Audaces..."
                            className="flex-1 p-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 placeholder-gray-400 transition-all border border-transparent focus:bg-white focus:border-blue-200"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || isLoading}
                            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${isOpen
                        ? "bg-gray-700 rotate-90 opacity-0 pointer-events-none absolute"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30"
                    }`}
                aria-label="Abrir chat de soporte"
            >
                <MessageCircle size={28} />
            </button>
        </div>
    );
};

export default ChatWidget;
 */
