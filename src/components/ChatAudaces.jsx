import { useState } from "react";
import { MessageCircle, Send, FileText, Loader2 } from "lucide-react";

export default function ChatAudaces() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "¡Hola! Soy tu asistente virtual de Audaces. Pregúntame lo que quieras sobre el software de diseño de moda.",
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
            const response = await fetch("http://localhost:3001/chat", {
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
                    content: "Error: Asegúrate de que el servidor esté corriendo en puerto 3001.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <MessageCircle size={24} />
                <h2>Chat Audaces</h2>
                <p>Consulta el manual de Audaces</p>
            </div>

            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="message-content">
                            <p>{msg.content}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="sources">
                                    <FileText size={16} />
                                    <span>
                                        {msg.sources.length} fuentes del manual
                                        {msg.sources[0].page && ` (págs. ${msg.sources.map(s => s.page).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="message-content loading">
                            <Loader2 size={20} className="spin" />
                            <span>Pensando...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Pregunta sobre Audaces..."
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
