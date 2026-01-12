import { useState } from "react";
import { Send, FileText, Loader2, Minimize2 } from "lucide-react";
import "./ChatAudacesWidget.css";
import avatarLuisPatty from "../assets/avatarLuisPatty.jpg";

export default function ChatAudacesWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "¡Hola! Soy AudacesExpert Pro. ¿En qué puedo ayudarte con Audaces 7?",
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
            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: input }),
            });

            const data = await response.json();

            const assistantMessage = {
                role: "assistant",
                content: data.answer || "No pude procesar tu pregunta.",
                sources: data.sources || [],
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Error de conexión. Verifica que el servidor esté corriendo.",
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
                    <img src={avatarLuisPatty} alt="IngeBot" className="widget-avatar" />
                    <div className="widget-badge">IngeBot para ayudarte</div>
                </button>
            )}

            {/* Chat Widget */}
            {isOpen && (
                <div className="audaces-widget-container">
                    <div className="audaces-widget-header">
                        <div className="header-content">
                            <img src={avatarLuisPatty} alt="IngeBot" className="header-avatar" />
                            <div>
                                <h3>IngeBot</h3>
                                <p>Tu asistente personal</p>
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
                                    <p>{msg.content}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="widget-sources">
                                            <FileText size={14} />
                                            <span>
                                                {msg.sources.length} fuentes
                                                {msg.sources[0].page && ` (págs. ${msg.sources.map(s => s.page).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="widget-message assistant">
                                <div className="widget-message-content loading">
                                    <Loader2 size={16} className="spin" />
                                    <span>Pensando...</span>
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
                            placeholder="Escribe tu consulta sobre Audaces..."
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
