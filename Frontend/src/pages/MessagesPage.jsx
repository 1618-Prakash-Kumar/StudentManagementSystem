import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../api";
import "../styles/Messages.css";

async function messagingRequest(path, options = {}) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    const responseText = response.status === 204 ? "" : await response.text();
    let data = null;
    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        const error = new Error(data?.message || "The messaging service could not complete your request.");
        error.status = response.status;
        throw error;
    }

    return data;
}

function formatMessageTime(value, includeDate = false) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, includeDate
        ? { dateStyle: "medium", timeStyle: "short" }
        : { hour: "numeric", minute: "2-digit" }).format(date);
}

function initials(name) {
    return (name || "Student")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

function MessagesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { conversationId } = useParams();
    const [searchParams] = useSearchParams();
    const productId = searchParams.get("productId");
    const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const startedProductRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [listError, setListError] = useState("");
    const [historyError, setHistoryError] = useState("");
    const [sendError, setSendError] = useState("");
    const [pageError, setPageError] = useState("");
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const loadConversations = useCallback(async (showLoading = false) => {
        if (showLoading) setListLoading(true);
        try {
            const data = await messagingRequest("/api/conversations");
            setConversations(data);
            setListError("");
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
            } else {
                setListError(error.message);
            }
        } finally {
            if (showLoading) setListLoading(false);
        }
    }, [location.pathname, location.search, navigate]);

    const loadMessages = useCallback(async (id, showLoading = false) => {
        if (!id) return;
        if (showLoading) {
            setMessages([]);
            setHistoryError("");
            setHistoryLoading(true);
        }
        try {
            const data = await messagingRequest(`/api/conversations/${id}/messages`);
            setMessages(data);
            setHistoryError("");
            await messagingRequest(`/api/conversations/${id}/read`, { method: "PUT" });
            await loadConversations();
        } catch (error) {
            if (error.status === 401) {
                navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
            } else {
                setHistoryError(error.message);
            }
        } finally {
            if (showLoading) setHistoryLoading(false);
        }
    }, [loadConversations, location.pathname, location.search, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
            return;
        }
        loadConversations(true);
        const interval = setInterval(() => loadConversations(), 10000);
        return () => clearInterval(interval);
    }, [loadConversations, location.pathname, location.search, navigate]);

    useEffect(() => {
        if (!productId || startedProductRef.current === productId) return;
        if (!localStorage.getItem("token")) return;
        startedProductRef.current = productId;
        messagingRequest("/api/conversations", {
            method: "POST",
            body: JSON.stringify({ productId: Number(productId) }),
        }).then((conversation) => {
            setPageError("");
            navigate(`/messages/${conversation.id}`, { replace: true });
            loadConversations();
        }).catch((error) => {
            if (error.status === 401 || error.status === 403) {
                navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
            } else {
                setPageError(error.message);
            }
        });
    }, [loadConversations, location.pathname, location.search, navigate, productId]);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setHistoryError("");
            setHistoryLoading(false);
            return undefined;
        }
        if (!localStorage.getItem("token")) return undefined;
        loadMessages(conversationId, true);
        const interval = setInterval(() => loadMessages(conversationId), 5000);
        return () => clearInterval(interval);
    }, [conversationId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (event) => {
        event.preventDefault();
        const content = input.trim();
        if (!content || !conversationId || sending) return;
        setSending(true);
        setSendError("");
        try {
            await messagingRequest(`/api/conversations/${conversationId}/messages`, {
                method: "POST",
                body: JSON.stringify({ content }),
            });
            setInput("");
            await Promise.all([loadMessages(conversationId), loadConversations()]);
        } catch (error) {
            setSendError(error.message);
        } finally {
            setSending(false);
        }
    };

    const selectedConversation = conversations.find((conversation) =>
        String(conversation.id) === String(conversationId));

    return (
        <main className={`messages-page ${conversationId ? "has-selected-conversation" : ""}`}>
            <header className="messages-topbar">
                <button type="button" className="messages-brand" onClick={() => navigate("/home")}>
                    College Exchange
                </button>
                <button type="button" className="messages-back-marketplace" onClick={() => navigate("/home")}>
                    Back to marketplace
                </button>
            </header>

            <section className="messages-workspace" aria-label="Messages">
                <aside className="conversation-sidebar">
                    <div className="conversation-sidebar-heading">
                        <div>
                            <p className="messages-eyebrow">Your inbox</p>
                            <h1>Messages</h1>
                        </div>
                    </div>
                    {pageError && <p className="messages-inline-error" role="alert">{pageError}</p>}
                    {listLoading && conversations.length === 0 ? (
                        <div className="messages-state">Loading conversations…</div>
                    ) : listError ? (
                        <div className="messages-state messages-error-state" role="alert">
                            <p>{listError}</p>
                            <button type="button" onClick={() => loadConversations(true)}>Try again</button>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="messages-state">
                            <MessageCircle size={24} aria-hidden="true" />
                            <p>No conversations yet</p>
                            <span>Message a seller from a listing to get started.</span>
                        </div>
                    ) : (
                        <div className="conversation-list">
                            {conversations.map((conversation) => (
                                <button
                                    type="button"
                                    key={conversation.id}
                                    className={`conversation-row ${String(conversation.id) === String(conversationId) ? "selected" : ""} ${conversation.unreadCount > 0 ? "unread" : ""}`}
                                    onClick={() => navigate(`/messages/${conversation.id}`)}
                                >
                                    {conversation.productThumbnailUrl ? (
                                        <img
                                            className="conversation-product-image"
                                            src={conversation.productThumbnailUrl}
                                            alt=""
                                        />
                                    ) : (
                                        <span className="conversation-avatar" aria-hidden="true">
                                            {initials(conversation.otherUserName)}
                                        </span>
                                    )}
                                    <span className="conversation-row-content">
                                        <span className="conversation-row-heading">
                                            <span className="conversation-person">{conversation.otherUserName || "Student"}</span>
                                            <time>{formatMessageTime(conversation.lastMessageAt)}</time>
                                        </span>
                                        <span className="conversation-product-title">
                                            {conversation.productTitle || "Listing"}
                                        </span>
                                        <span className="conversation-preview">
                                            {conversation.lastMessagePreview || "No messages yet"}
                                        </span>
                                    </span>
                                    {conversation.unreadCount > 0 && (
                                        <span className="conversation-unread-dot" aria-label={`${conversation.unreadCount} unread messages`}>
                                            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                <section className="conversation-panel" aria-label="Conversation">
                    {!conversationId ? (
                        <div className="conversation-placeholder">
                            <MessageCircle size={30} aria-hidden="true" />
                            <h2>Select a conversation</h2>
                            <p>Your messages with buyers and sellers will appear here.</p>
                        </div>
                    ) : (
                        <>
                            <header className="conversation-header">
                                <button
                                    type="button"
                                    className="mobile-conversation-back"
                                    onClick={() => navigate("/messages")}
                                    aria-label="Back to conversations"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <span className="conversation-avatar conversation-header-avatar">
                                    {initials(selectedConversation?.otherUserName)}
                                </span>
                                <div className="conversation-header-person">
                                    <h2>{selectedConversation?.otherUserName || "Conversation"}</h2>
                                    <span>
                                        {selectedConversation?.otherUserEmail || "College Exchange member"}
                                        {selectedConversation?.otherUserPhone ? ` · ${selectedConversation.otherUserPhone}` : ""}
                                    </span>
                                </div>
                                <div className="conversation-listing">
                                    {selectedConversation?.productThumbnailUrl && (
                                        <img src={selectedConversation.productThumbnailUrl} alt="" />
                                    )}
                                    <span>{selectedConversation?.productTitle || "Listing"}</span>
                                </div>
                            </header>

                            <div className="message-history" aria-live="polite">
                                {historyLoading && messages.length === 0 ? (
                                    <div className="messages-state">Loading message history…</div>
                                ) : historyError ? (
                                    <div className="messages-state messages-error-state" role="alert">
                                        <p>{historyError}</p>
                                        <button type="button" onClick={() => loadMessages(conversationId, true)}>Try again</button>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="message-history-empty">
                                        <p>This conversation is ready.</p>
                                        <span>Send a message to start discussing the listing.</span>
                                    </div>
                                ) : (
                                    <div className="message-list">
                                        {messages.map((message) => {
                                            const isMine = (message.senderEmail || "").toLowerCase() === currentUserEmail;
                                            return (
                                                <article
                                                    key={message.id}
                                                    className={`message-item ${isMine ? "message-mine" : "message-theirs"}`}
                                                >
                                                    <div className="message-bubble">
                                                        {!isMine && <span className="message-sender">{message.senderName}</span>}
                                                        <p>{message.content}</p>
                                                        <time>{formatMessageTime(message.createdAt, true)}</time>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <div className="message-compose-wrap">
                                <p className="messages-polling-note">Messages refresh automatically about every 5 seconds.</p>
                                {sendError && <p className="messages-inline-error" role="alert">{sendError}</p>}
                                <form className="message-compose" onSubmit={sendMessage}>
                                    <textarea
                                        aria-label="Write a message"
                                        placeholder="Write a message…"
                                        value={input}
                                        maxLength={2000}
                                        onChange={(event) => setInput(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                                event.preventDefault();
                                                event.currentTarget.form?.requestSubmit();
                                            }
                                        }}
                                        rows={1}
                                    />
                                    <button type="submit" disabled={!input.trim() || sending} aria-label="Send message">
                                        <Send size={18} aria-hidden="true" />
                                        <span>{sending ? "Sending…" : "Send"}</span>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </section>
            </section>
        </main>
    );
}

export default MessagesPage;
