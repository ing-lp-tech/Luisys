import { useState } from "react";
import { Send, Loader2, Minimize2 } from "lucide-react";
import "./ChatAudacesWidget.css";
import avatarLuisPatty from "../assets/avatarLuisPatty.jpg";
import CHATBOT_RULES from "../lib/chatbot_rules.js";

export default function ChatVendedor() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: `¡Hola! 👋 Soy **IngeBot** de Electro Luisys.\n\n¿En qué puedo ayudarte hoy?\n\n1. 🛒 **Comprar Productos** (Plotters, Papel)\n\n2. 🔧 **Asistencia Técnica**\n\n3. 👤 **Hablar con el Dueño**\n\nResponde con el número (1, 2 o 3)`,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [conversationContext, setConversationContext] = useState({ lastMenu: 'main' });

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        const userInput = input;
        setInput("");
        setLoading(true);

        try {
            // ========== PASO 1: Intentar responder con REGLAS (SIN IA) ==========
            const ruleResponse = CHATBOT_RULES.tryRespond(userInput, conversationContext);

            // Si las reglas pueden responder → NO llamamos a OpenAI (GRATIS ✅)
            if (!ruleResponse.useAI) {
                console.log('✅ Respondido con REGLAS (sin IA) - Costo: $0');

                const assistantMessage = {
                    role: "assistant",
                    content: ruleResponse.response,
                };

                setMessages((prev) => [...prev, assistantMessage]);

                // Actualizar contexto de conversación
                if (ruleResponse.context) {
                    setConversationContext((prev) => ({ ...prev, ...ruleResponse.context }));
                }

                setLoading(false);
                return; // ← TERMINA AQUÍ, no llama al backend
            }

            // ========== PASO 2: SI NO PUEDE RESPONDER CON REGLAS → Llamar OpenAI ==========
            console.log('💸 Llamando a OpenAI API - Razón:', ruleResponse.reason);

            let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

            // Sanitizar URL
            baseUrl = baseUrl.trim();
            if (baseUrl.startsWith('https:/') && !baseUrl.startsWith('https://')) {
                baseUrl = baseUrl.replace('https:/', 'https://');
            }
            if (!baseUrl.startsWith('http')) {
                baseUrl = `https://${baseUrl}`;
            }
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }

            console.log('Sending AI request to:', `${baseUrl}/chat-vendedor`);

            const response = await fetch(`${baseUrl}/chat-vendedor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: userInput,
                    messages: [...messages, userMessage] // Enviar historial completo
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 50)}...`);
            }

            const data = await response.json();

            const assistantMessage = {
                role: "assistant",
                content: data.answer || "No pude procesar tu pregunta. ¿Podrías reformularla?",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Mis disculpas, estoy teniendo dificultades técnicas momentáneas. Por favor intenta de nuevo en unos segundos.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Función para convertir links markdown [texto](url) a HTML clickeable
    const renderMessageWithLinks = (text) => {
        // Regex para detectar [texto](url)
        const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            // Agregar texto antes del link
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            // Agregar el link como elemento clickeable
            const linkText = match[1];
            const url = match[2];
            parts.push(
                <a
                    key={match.index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4A90E2', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                    {linkText}
                </a>
            );

            lastIndex = linkRegex.lastIndex;
        }

        // Agregar texto restante
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <>
            {/* Widget Button */}
            {!isOpen && (
                <button className="audaces-widget-button" onClick={() => setIsOpen(true)}>
                    <img src={avatarLuisPatty} alt="IngeBot Vendedor" className="widget-avatar" />
                    <div className="widget-badge">IngeBot Vendedor</div>
                </button>
            )}

            {/* Chat Widget */}
            {isOpen && (
                <div className="audaces-widget-container">
                    <div className="audaces-widget-header">
                        <div className="header-content">
                            <img src={avatarLuisPatty} alt="IngeBot Vendedor" className="header-avatar" />
                            <div>
                                <h3>IngeBot Vendedor</h3>
                                <p>Especialista en soluciones textiles</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button onClick={() => setIsOpen(false)} title="Minimizar">
                                <Minimize2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="audaces-widget-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`widget-message ${msg.role}`}>
                                <div className="widget-message-content">
                                    <p style={{ whiteSpace: 'pre-wrap' }}>
                                        {renderMessageWithLinks(msg.content)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="widget-message assistant">
                                <div className="widget-message-content loading">
                                    <Loader2 size={16} className="spin" />
                                    <span>Analizando tu consulta...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="audaces-widget-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Pregunta sobre plotters, precios, beneficios..."
                            disabled={loading}
                        />
                        <button onClick={sendMessage} disabled={loading || !input.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
