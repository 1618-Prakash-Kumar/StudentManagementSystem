import { useState } from "react";
import "../styles/NotificationModal.css";

function NotificationModal({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) {
    const [markingAll, setMarkingAll] = useState(false);

    const handleMarkAll = async () => {
        setMarkingAll(true);
        await onMarkAllAsRead();
        setMarkingAll(false);
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            return date.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return isoString;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notif-modal-backdrop" onClick={onClose}>
            <div className="notif-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="notif-modal-header">
                    <div className="notif-header-title">
                        <h2>🔔 Seller Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="notif-unread-count-pill">{unreadCount} New</span>
                        )}
                    </div>
                    <div className="notif-header-actions">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="mark-all-btn"
                                onClick={handleMarkAll}
                                disabled={markingAll}
                            >
                                Mark all as read
                            </button>
                        )}
                        <button className="notif-close-btn" onClick={onClose} title="Close Notifications">✕</button>
                    </div>
                </div>

                <div className="notif-modal-body">
                    {notifications.length === 0 ? (
                        <div className="notif-empty-state">
                            <div className="notif-empty-icon">📭</div>
                            <h3>No Notifications Yet</h3>
                            <p>When buyers add your listed products to their cart, you'll receive real-time alerts with their contact details here.</p>
                        </div>
                    ) : (
                        <div className="notif-list">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`notif-card ${!notif.isRead ? "unread" : ""}`}
                                    onClick={() => !notif.isRead && onMarkAsRead(notif.id)}
                                >
                                    <div className="notif-card-header">
                                        <span className="notif-type-tag">🛒 Product Added to Cart</span>
                                        <span className="notif-time">{formatTime(notif.createdAt)}</span>
                                    </div>

                                    <div className="notif-product-row">
                                        <strong className="notif-product-title">📦 {notif.productName}</strong>
                                        <span className="notif-quantity-badge">Qty: {notif.quantity} unit(s)</span>
                                    </div>

                                    <div className="notif-buyer-details">
                                        <div className="buyer-field">
                                            <span className="buyer-label">Buyer:</span>
                                            <span className="buyer-val">👤 {notif.buyerName}</span>
                                        </div>
                                        {notif.buyerPhone && (
                                            <div className="buyer-field">
                                                <span className="buyer-label">Phone:</span>
                                                <a
                                                    href={`tel:${notif.buyerPhone}`}
                                                    className="buyer-link buyer-phone"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    📞 {notif.buyerPhone}
                                                </a>
                                            </div>
                                        )}
                                        {notif.buyerEmail && (
                                            <div className="buyer-field">
                                                <span className="buyer-label">Email:</span>
                                                <a
                                                    href={`mailto:${notif.buyerEmail}`}
                                                    className="buyer-link buyer-email"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    ✉️ {notif.buyerEmail}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {!notif.isRead && (
                                        <div className="notif-unread-dot" title="Unread notification"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotificationModal;
