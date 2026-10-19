import { useState } from "react";
import "../styles/CartModal.css";

function CartModal({ cart, onUpdateQuantity, onRemoveItem, onClearCart, onClose }) {
    const [updatingId, setUpdatingId] = useState(null);

    const handleQtyChange = async (itemId, newQty) => {
        setUpdatingId(itemId);
        await onUpdateQuantity(itemId, newQty);
        setUpdatingId(null);
    };

    const items = cart?.items || [];
    const grandTotal = cart?.grandTotal || 0;
    const totalItems = cart?.totalItems || 0;

    return (
        <div className="cart-modal-backdrop" onClick={onClose}>
            <div className="cart-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="cart-modal-header">
                    <div className="cart-header-title">
                        <h2>🛒 My Campus Cart</h2>
                        <span className="cart-item-count-pill">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                    </div>
                    <button className="cart-close-btn" onClick={onClose} title="Close Cart">✕</button>
                </div>

                <div className="cart-modal-body">
                    {items.length === 0 ? (
                        <div className="cart-empty-state">
                            <div className="cart-empty-icon">🛒</div>
                            <h3>Your Cart is Empty</h3>
                            <p>Browse listings on the BUY page and add products to your cart.</p>
                            <button className="cart-browse-btn" onClick={onClose}>
                                Continue Browsing
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {items.map((item) => (
                                <div className="cart-item-row" key={item.id}>
                                    <div className="cart-item-info">
                                        <div className="cart-item-badge-row">
                                            <span className="cart-category-tag">📁 {item.categoryName || "General"}</span>
                                            <span className="cart-condition-tag">✨ {item.productCondition || "GOOD"}</span>
                                        </div>
                                        <h4 className="cart-item-title">{item.productTitle}</h4>
                                        <div className="cart-seller-info">
                                            <span>👤 Seller: <strong>{item.sellerName || "Campus Student"}</strong></span>
                                            {item.sellerPhone && (
                                                <span className="cart-seller-phone">📞 {item.sellerPhone}</span>
                                            )}
                                        </div>
                                        <div className="cart-unit-price">
                                            ₹{item.unitPrice} each <span className="cart-stock-hint">(In Stock: {item.availableQuantity})</span>
                                        </div>
                                    </div>

                                    <div className="cart-item-actions">
                                        <div className="cart-qty-control">
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                                                disabled={updatingId === item.id || item.quantity <= 1}
                                                title="Decrease quantity"
                                            >
                                                −
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                                                disabled={updatingId === item.id || item.quantity >= item.availableQuantity}
                                                title={item.quantity >= item.availableQuantity ? "Max available quantity reached" : "Increase quantity"}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="cart-item-total">
                                            ₹{item.totalPrice}
                                        </div>

                                        <button
                                            type="button"
                                            className="cart-remove-btn"
                                            onClick={() => onRemoveItem(item.id)}
                                            title="Remove from Cart"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-modal-footer">
                        <div className="cart-summary-row">
                            <span className="summary-label">Grand Total:</span>
                            <span className="summary-amount">₹{grandTotal}</span>
                        </div>
                        <div className="cart-footer-buttons">
                            <button
                                type="button"
                                className="clear-cart-btn"
                                onClick={onClearCart}
                            >
                                Clear Cart
                            </button>
                            <button
                                type="button"
                                className="checkout-hint-btn"
                                onClick={onClose}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartModal;
