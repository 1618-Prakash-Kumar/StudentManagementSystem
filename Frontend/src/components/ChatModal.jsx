import { useState, useEffect, useRef } from "react";
import "../styles/ChatModal.css";

function ChatModal({ product, currentUserEmail, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const storageKey = `chat_${product.id}_${currentUserEmail || "guest"}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved chat:", e);
                initializeDefaultChat();
            }
        } else {
            initializeDefaultChat();
        }
    }, [product.id]);

    const initializeDefaultChat = () => {
        const defaultMsgs = [
            {
                id: 1,
                sender: "system",
                text: `You started a chat with ${product.sellerName || "the seller"} regarding "${product.title}".`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
        ];
        setMessages(defaultMsgs);
        localStorage.setItem(storageKey, JSON.stringify(defaultMsgs));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (textToSend) => {
        const text = textToSend || inputText;
        if (!text.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: "buyer",
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        const updated = [...messages, newMsg];
        setMessages(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setInputText("");

        // Simulate a realistic seller response after 1 second
        setTimeout(() => {
            const sellerReplies = [
                `Hi! Yes, "${product.title}" is still available. When would you like to collect it on campus?`,
                `Hello! Sure, feel free to call or WhatsApp me at ${product.sellerPhone || "my registered number"}.`,
                `Hi there! I am usually available near the library or cafeteria between 4 PM - 6 PM.`
            ];
            const replyText = sellerReplies[Math.floor(Math.random() * sellerReplies.length)];

            const sellerMsg = {
                id: Date.now() + 1,
                sender: "seller",
                sellerName: product.sellerName || "Seller",
                text: replyText,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            setMessages((prev) => {
                const nextList = [...prev, sellerMsg];
                localStorage.setItem(storageKey, JSON.stringify(nextList));
                return nextList;
            });
        }, 1000);
    };

    const quickPrompts = [
        "Is this item still available?",
        "Can we meet at the campus library today?",
        "Is the price negotiable?"
    ];

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-box" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-modal-header">
                    <div className="chat-seller-info">
                        <div className="seller-avatar">
                            {(product.sellerName || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3>{product.sellerName || "Campus Seller"}</h3>
                            <p className="chat-product-sub">
                                <strong>₹{product.price}</strong> • {product.title}
                            </p>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Seller Quick Contact Banner */}
                <div className="chat-contact-bar">
                    <span>📞 {product.sellerPhone || "Phone not provided"}</span>
                    <span>✉️ {product.sellerEmail || "Email not provided"}</span>
                </div>

                {/* Message Body */}
                <div className="chat-messages-container">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-bubble-wrapper ${
                                msg.sender === "buyer"
                                    ? "buyer"
                                    : msg.sender === "system"
                                    ? "system"
                                    : "seller"
                            }`}
                        >
                            {msg.sender === "seller" && (
                                <span className="sender-label">{msg.sellerName || "Seller"}</span>
                            )}
                            <div className="chat-bubble">
                                <p>{msg.text}</p>
                                <span className="message-time">{msg.time}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="chat-quick-prompts">
                    {quickPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="prompt-chip"
                            onClick={() => handleSendMessage(prompt)}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                {/* Input Footer */}
                <form
                    className="chat-input-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                >
                    <input
                        type="text"
                        placeholder="Type a message to the seller..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={!inputText.trim()}>
                        Send ✉
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatModal;
