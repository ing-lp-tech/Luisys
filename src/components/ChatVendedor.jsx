import { useState } from "react";
import { Send, FileText, Loader2, Minimize2 } from "lucide-react";
import "./ChatAudacesWidget.css"; // Reutilizamos los mismos estilos
import avatarLuisPatty from "../assets/avatarLuisPatty.jpg";

export default function ChatVendedor() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "¡Hola! 👋 Soy IngeBot, tu asesor especializado. ¿Estás buscando digitalizar tu proceso de tizada y dejar atrás el cartón? Cuéntame sobre tu taller y te ayudo a encontrar la solución perfecta.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/chat-vendedor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: input }),
            });

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
                    content: "Disculpa, tuve un problema de conexión. Por favor, contacta directamente al WhatsApp 1162020911 para una atención inmediata. 📱",
                },
            ]);
        } finally {
            setLoading(false);
        }
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
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
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
