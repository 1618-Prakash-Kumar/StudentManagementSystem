import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatModal from "./ChatModal";
import CartModal from "./CartModal";
import NotificationModal from "./NotificationModal";
import "../styles/Home.css";

function Home() {
    const navigate = useNavigate();
    const location = useLocation();

    // Mode state: 'BUY' (default) or 'SELL'
    const [activeTab, setActiveTab] = useState("BUY");

    // Product state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [sortBy, setSortBy] = useState("DEFAULT"); // 'DEFAULT', 'PRICE_ASC', 'PRICE_DESC'

    // Selected quantities for Add-to-Cart mapped by product id
    const [cartAddQuantities, setCartAddQuantities] = useState({});

    // Seller Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [status, setStatus] = useState("AVAILABLE");
    const [categoryId, setCategoryId] = useState("");
    const [condition, setCondition] = useState("GOOD");
    const [categories, setCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: "", text: "" });

    // Modals state
    const [activeChatProduct, setActiveChatProduct] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Cart state
    const [cart, setCart] = useState({ items: [], totalItems: 0, grandTotal: 0 });
    const [cartToast, setCartToast] = useState("");

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Current user info
    const currentUserEmail = localStorage.getItem("userEmail") || "";
    const userRole = localStorage.getItem("userRole") || "USER";

    // Check if redirected from another route requesting sell mode
    useEffect(() => {
        if (location.pathname === "/create-product") {
            setActiveTab("SELL");
        }
    }, [location.pathname]);

    // Fetch products
    const fetchProducts = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("http://localhost:8080/api/products", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }
                throw new Error("Unable to load marketplace listings");
            }

            const data = await response.json();
            setProducts(data);
            setError("");
        } catch (err) {
            setError(err.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/categories");
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
                if (data.length > 0 && !categoryId) {
                    setCategoryId(String(data[0].id));
                }
            }
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    // Fetch Cart
    const fetchCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("http://localhost:8080/api/cart", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCart(data);
            }
        } catch (err) {
            console.error("Failed to load cart", err);
        }
    };

    // Fetch Notifications
    const fetchNotifications = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("http://localhost:8080/api/notifications", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                const unread = data.filter((n) => !n.isRead).length;
                setUnreadNotifCount(unread);
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchCart();
        fetchNotifications();

        // Polling notifications every 10 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        navigate("/login");
    };

    // Handle Add to Cart
    const handleAddToCart = async (product) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const qtyToAdd = cartAddQuantities[product.id] || 1;

        try {
            const response = await fetch("http://localhost:8080/api/cart/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: qtyToAdd,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to add product to cart");
            }

            const updatedCart = await response.json();
            setCart(updatedCart);

            // Show Toast
            setCartToast(`✅ Added ${qtyToAdd} unit(s) of "${product.title}" to cart. Seller notified! 🔔`);
            setTimeout(() => setCartToast(""), 3500);

            // Refresh notifications for seller view
            fetchNotifications();
        } catch (err) {
            alert(err.message || "Could not add to cart");
        }
    };

    // Handle Cart item quantity update
    const handleUpdateCartQuantity = async (cartItemId, newQty) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8080/api/cart/items/${cartItemId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ quantity: newQty }),
            });

            if (response.ok) {
                const updated = await response.json();
                setCart(updated);
            } else {
                const errData = await response.json().catch(() => null);
                alert(errData?.message || "Failed to update quantity");
            }
        } catch (err) {
            console.error("Error updating cart quantity", err);
        }
    };

    // Handle Cart item removal
    const handleRemoveCartItem = async (cartItemId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8080/api/cart/items/${cartItemId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const updated = await response.json();
                setCart(updated);
            }
        } catch (err) {
            console.error("Error removing cart item", err);
        }
    };

    // Handle Clear Cart
    const handleClearCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("http://localhost:8080/api/cart", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setCart({ items: [], totalItems: 0, grandTotal: 0 });
            }
        } catch (err) {
            console.error("Error clearing cart", err);
        }
    };

    // Handle Mark Notification as Read
    const handleMarkNotifAsRead = async (notifId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8080/api/notifications/${notifId}/read`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error("Error marking notification read", err);
        }
    };

    // Handle Mark All Notifications as Read
    const handleMarkAllNotifsAsRead = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("http://localhost:8080/api/notifications/read-all", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error("Error marking all notifications read", err);
        }
    };

    // Handle Seller Listing submission
    const handleCreateListing = async (e) => {
        e.preventDefault();
        setFormMessage({ type: "", text: "" });

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        if (!categoryId) {
            setFormMessage({ type: "error", text: "Please select a valid product category." });
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch("http://localhost:8080/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    price: Number(price),
                    quantity: Number(quantity),
                    status,
                    categoryId: Number(categoryId),
                    productCondition: condition,
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || "Failed to list the product");
            }

            // Reset form
            setTitle("");
            setDescription("");
            setPrice("");
            setQuantity("1");
            setStatus("AVAILABLE");
            setCondition("GOOD");
            setFormMessage({ type: "success", text: "Product listed successfully! Switching to BUY view..." });

            // Refresh products
            await fetchProducts();

            // Switch to BUY tab after short delay
            setTimeout(() => {
                setActiveTab("BUY");
                setFormMessage({ type: "", text: "" });
            }, 900);
        } catch (err) {
            setFormMessage({ type: "error", text: err.message || "Error submitting listing" });
        } finally {
            setSubmitting(false);
        }
    };

    // Filter and Sort products
    const processedProducts = useMemo(() => {
        let list = products.filter((item) => {
            const matchesCategory =
                selectedCategory === "ALL" ||
                (item.categoryName && item.categoryName.toLowerCase() === selectedCategory.toLowerCase());

            const matchesSearch =
                !searchTerm ||
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sellerName?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesCategory && matchesSearch;
        });

        if (sortBy === "PRICE_ASC") {
            list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortBy === "PRICE_DESC") {
            list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
        }

        return list;
    }, [products, selectedCategory, searchTerm, sortBy]);

    return (
        <div className="marketplace-container">
            {/* Global Toast Notification */}
            {cartToast && (
                <div className="cart-toast-banner">
                    {cartToast}
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className="marketplace-navbar">
                <div className="navbar-left">
                    <div className="brand-logo" onClick={() => setActiveTab("BUY")}>
                        <span className="brand-icon">🎓</span>
                        <div className="brand-text">
                            <span className="brand-title">College Exchange</span>
                            <span className="brand-tagline">Campus Student Marketplace</span>
                        </div>
                    </div>

                    {/* OLX-Style BUY & SELL Mode Switcher */}
                    <div className="mode-tabs">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "BUY" ? "active-buy" : ""}`}
                            onClick={() => setActiveTab("BUY")}
                        >
                            🛍️ BUY <span className="tab-pill">Explore</span>
                        </button>

                        <button
                            type="button"
                            className={`tab-btn sell-tab-btn ${activeTab === "SELL" ? "active-sell" : ""}`}
                            onClick={() => setActiveTab("SELL")}
                        >
                            ➕ SELL <span className="tab-pill-sell">List Item</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar in Navbar */}
                {activeTab === "BUY" && (
                    <div className="navbar-search">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Find books, cycles, calculators, hostel items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm("")}>
                                ✕
                            </button>
                        )}
                    </div>
                )}

                <div className="navbar-right">
                    {/* Cart Button with Count Badge */}
                    <button
                        type="button"
                        className="nav-cart-btn"
                        onClick={() => setIsCartOpen(true)}
                        title="View My Cart"
                    >
                        🛒 Cart
                        {cart.totalItems > 0 && (
                            <span className="cart-badge-count">{cart.totalItems}</span>
                        )}
                    </button>

                    {/* Seller Notifications Button with Unread Badge */}
                    <button
                        type="button"
                        className={`nav-notif-btn ${unreadNotifCount > 0 ? "has-unread" : ""}`}
                        onClick={() => setIsNotifOpen(true)}
                        title="View Seller Notifications"
                    >
                        🔔 Alerts
                        {unreadNotifCount > 0 && (
                            <span className="notif-badge-count">{unreadNotifCount}</span>
                        )}
                    </button>

                    {/* Admin Panel Quick Link (Visible only for ADMIN role) */}
                    {userRole === "ADMIN" && (
                        <button
                            type="button"
                            className="nav-admin-btn"
                            onClick={() => navigate("/admin")}
                            title="Open Admin Control Panel"
                        >
                            🛡️ Admin Panel
                        </button>
                    )}

                    <div className="user-profile-badge">
                        <span className="user-avatar-circle">
                            {(currentUserEmail || "U").charAt(0).toUpperCase()}
                        </span>
                        <div className="user-info-text">
                            <span className="user-email">{currentUserEmail || "Student User"}</span>
                            <span className="user-role-badge">
                                {userRole === "ADMIN" ? "👑 Admin" : (activeTab === "BUY" ? "👤 Buyer Mode" : "🏷️ Seller Mode")}
                            </span>
                        </div>
                    </div>

                    <button type="button" className="nav-logout-btn" onClick={handleLogout} title="Logout">
                        Logout 🚪
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="marketplace-content">
                {/* ---------------------------------------------------- */}
                {/* BUY VIEW (Default Mode) */}
                {/* ---------------------------------------------------- */}
                {activeTab === "BUY" && (
                    <section className="buy-view-section">
                        {/* Subheader banner */}
                        <div className="marketplace-banner">
                            <div className="banner-text">
                                <h2>Browse Campus Listings</h2>
                                <p>Discover pre-owned books, gadgets, cycles, and hostel gear listed by fellow students.</p>
                            </div>
                            <button
                                type="button"
                                className="banner-sell-cta"
                                onClick={() => setActiveTab("SELL")}
                            >
                                Have something to sell? <strong>+ List Product</strong>
                            </button>
                        </div>

                        {/* Controls Bar: Category Filters & Price Sorting */}
                        <div className="marketplace-controls-bar">
                            {/* Category Filter Chips */}
                            <div className="category-filter-bar">
                                <button
                                    type="button"
                                    className={`category-chip ${selectedCategory === "ALL" ? "active" : ""}`}
                                    onClick={() => setSelectedCategory("ALL")}
                                >
                                    All Products
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`category-chip ${selectedCategory === cat.name ? "active" : ""}`}
                                        onClick={() => setSelectedCategory(cat.name)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Price Sorting Selector */}
                            <div className="price-sort-control">
                                <label htmlFor="price-sort-select">📊 Sort By:</label>
                                <select
                                    id="price-sort-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="price-sort-dropdown"
                                >
                                    <option value="DEFAULT">✨ Newest First</option>
                                    <option value="PRICE_ASC">💵 Price: Low to High (Increasing ↑)</option>
                                    <option value="PRICE_DESC">💰 Price: High to Low (Decreasing ↓)</option>
                                </select>
                            </div>
                        </div>

                        {/* Loading / Error States */}
                        {loading && (
                            <div className="state-message-box">
                                <div className="loading-spinner"></div>
                                <p>Loading campus marketplace products...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="state-error-box">
                                <p>⚠️ {error}</p>
                                <button onClick={fetchProducts}>Try Again</button>
                            </div>
                        )}

                        {/* Empty States */}
                        {!loading && !error && processedProducts.length === 0 && (
                            <div className="empty-marketplace-box">
                                <h3>No listings found</h3>
                                <p>
                                    {searchTerm || selectedCategory !== "ALL"
                                        ? "Try adjusting your search keyword or selected category filter."
                                        : "Be the first to list a product in your college community!"}
                                </p>
                                <button
                                    type="button"
                                    className="primary-action-btn"
                                    onClick={() => setActiveTab("SELL")}
                                >
                                    + Start Selling Now
                                </button>
                            </div>
                        )}

                        {/* Products Grid */}
                        {!loading && !error && processedProducts.length > 0 && (
                            <div className="products-grid">
                                {processedProducts.map((product) => {
                                    const isOwnProduct =
                                        currentUserEmail &&
                                        product.sellerEmail &&
                                        product.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase();

                                    const isAvailable = product.status === "AVAILABLE" && (product.quantity || 0) > 0;
                                    const isAvailableSoon = product.status === "AVAILABLE_SOON";
                                    const isNotAvailable = product.status === "NOT_AVAILABLE" || (product.quantity || 0) <= 0;

                                    const selectedQty = cartAddQuantities[product.id] || 1;
                                    const maxAvailableQty = product.quantity || 1;

                                    return (
                                        <article className="olx-product-card" key={product.id}>
                                            <div className="card-top-tags">
                                                <span className="category-tag">
                                                    📁 {product.categoryName || "General"}
                                                </span>
                                                <span className={`condition-tag condition-${(product.productCondition || "GOOD").toLowerCase()}`}>
                                                    ✨ {product.productCondition || "GOOD"}
                                                </span>
                                            </div>

                                            <div className="card-body">
                                                <div className="card-price-row">
                                                    <span className="product-price">₹{product.price}</span>
                                                    {/* Product Availability & Stock Pill */}
                                                    {isAvailable && (
                                                        <span className="status-badge-available">
                                                            ✅ In Stock ({product.quantity})
                                                        </span>
                                                    )}
                                                    {isAvailableSoon && (
                                                        <span className="status-badge-soon">
                                                            ⏳ Available Soon
                                                        </span>
                                                    )}
                                                    {isNotAvailable && (
                                                        <span className="status-badge-out">
                                                            🚫 Out of Stock
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="product-title">{product.title}</h3>
                                                <p className="product-desc">
                                                    {product.description || "No additional description provided."}
                                                </p>
                                            </div>

                                            {/* Seller Contact & Details Section */}
                                            <div className="card-seller-section">
                                                <div className="seller-meta">
                                                    <span className="seller-avatar-small">
                                                        {(product.sellerName || "S").charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="seller-text">
                                                        <span className="seller-label">Seller</span>
                                                        <span className="seller-name">
                                                            {product.sellerName || "Student Seller"}
                                                            {isOwnProduct && <span className="you-badge"> (You)</span>}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="seller-contact-details">
                                                    {product.sellerPhone && (
                                                        <div className="contact-line">
                                                            <span>📞</span>
                                                            <a href={`tel:${product.sellerPhone}`}>
                                                                {product.sellerPhone}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {product.sellerEmail && (
                                                        <div className="contact-line">
                                                            <span>✉️</span>
                                                            <a href={`mailto:${product.sellerEmail}`}>
                                                                {product.sellerEmail}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Add to Cart Section with Quantity Selector */}
                                            <div className="card-cart-section">
                                                {isAvailable ? (
                                                    <div className="cart-add-wrapper">
                                                        <div className="qty-picker">
                                                            <label htmlFor={`qty-${product.id}`}>Qty:</label>
                                                            <select
                                                                id={`qty-${product.id}`}
                                                                value={selectedQty}
                                                                onChange={(e) =>
                                                                    setCartAddQuantities({
                                                                        ...cartAddQuantities,
                                                                        [product.id]: Number(e.target.value),
                                                                    })
                                                                }
                                                                className="qty-dropdown"
                                                            >
                                                                {Array.from({ length: maxAvailableQty }, (_, i) => i + 1).map((q) => (
                                                                    <option key={q} value={q}>
                                                                        {q}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="add-to-cart-btn"
                                                            onClick={() => handleAddToCart(product)}
                                                        >
                                                            🛒 Add to Cart
                                                        </button>
                                                    </div>
                                                ) : isAvailableSoon ? (
                                                    <button type="button" className="cart-disabled-btn soon" disabled>
                                                        ⏳ Available Soon (Cannot Add)
                                                    </button>
                                                ) : (
                                                    <button type="button" className="cart-disabled-btn out" disabled>
                                                        🚫 Out of Stock (Unavailable)
                                                    </button>
                                                )}
                                            </div>

                                            {/* Card Action Buttons: Chat & WhatsApp */}
                                            <div className="card-actions">
                                                <button
                                                    type="button"
                                                    className="chat-action-btn"
                                                    onClick={() => setActiveChatProduct(product)}
                                                >
                                                    💬 Chat with Seller
                                                </button>

                                                {product.sellerPhone && (
                                                    <a
                                                        href={`https://wa.me/${product.sellerPhone.replace(/[^0-9]/g, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="whatsapp-action-btn"
                                                        title="Contact on WhatsApp / Call"
                                                    >
                                                        📲 WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* ---------------------------------------------------- */}
                {/* SELL VIEW (Listing Form) */}
                {/* ---------------------------------------------------- */}
                {activeTab === "SELL" && (
                    <section className="sell-view-section">
                        <div className="sell-form-card">
                            <div className="sell-card-header">
                                <div>
                                    <span className="sell-badge">Seller Studio</span>
                                    <h2>Post an Ad / List a Product</h2>
                                    <p>Fill in product details, set available quantity and status to make it visible to campus buyers.</p>
                                </div>
                                <button
                                    type="button"
                                    className="back-to-buy-btn"
                                    onClick={() => setActiveTab("BUY")}
                                >
                                    ← Back to BUY Page
                                </button>
                            </div>

                            {formMessage.text && (
                                <div className={`form-feedback-alert ${formMessage.type}`}>
                                    {formMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleCreateListing} className="seller-listing-form">
                                <div className="form-group">
                                    <label htmlFor="product-title">
                                        Product Title <span className="required-star">*</span>
                                    </label>
                                    <input
                                        id="product-title"
                                        type="text"
                                        placeholder="e.g. Engineering Physics Textbook, Casio FX-82, Lab Apron"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                    <small className="field-hint">Include brand, edition, or key features for faster sales.</small>
                                </div>

                                <div className="form-grid-row">
                                    <div className="form-group">
                                        <label htmlFor="product-category">
                                            Category <span className="required-star">*</span>
                                        </label>
                                        <select
                                            id="product-category"
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            required
                                        >
                                            {categories.length === 0 ? (
                                                <option value="">Loading categories...</option>
                                            ) : (
                                                categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="product-price">
                                            Price (₹ INR) <span className="required-star">*</span>
                                        </label>
                                        <input
                                            id="product-price"
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="e.g. 450"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="product-quantity">
                                            Quantity Available <span className="required-star">*</span>
                                        </label>
                                        <input
                                            id="product-quantity"
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="e.g. 1"
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setQuantity(val);
                                                if (Number(val) === 0) {
                                                    setStatus("NOT_AVAILABLE");
                                                } else if (status === "NOT_AVAILABLE" && Number(val) > 0) {
                                                    setStatus("AVAILABLE");
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-grid-row">
                                    <div className="form-group">
                                        <label htmlFor="product-status">
                                            Availability Status <span className="required-star">*</span>
                                        </label>
                                        <select
                                            id="product-status"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            required
                                        >
                                            <option value="AVAILABLE">✅ AVAILABLE (Ready to sell)</option>
                                            <option value="AVAILABLE_SOON">⏳ AVAILABLE_SOON (Coming soon)</option>
                                            <option value="NOT_AVAILABLE">🚫 NOT_AVAILABLE (Out of stock / Sold)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="product-condition">
                                            Condition <span className="required-star">*</span>
                                        </label>
                                        <select
                                            id="product-condition"
                                            value={condition}
                                            onChange={(e) => setCondition(e.target.value)}
                                            required
                                        >
                                            <option value="NEW">New (Unopened / Unused)</option>
                                            <option value="LIKE_NEW">Like New (Barely used)</option>
                                            <option value="GOOD">Good (Working fine with minor signs)</option>
                                            <option value="FAIR">Fair (Usable condition)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="product-desc">
                                        Description & Pickup Details
                                    </label>
                                    <textarea
                                        id="product-desc"
                                        rows="4"
                                        placeholder="Describe the condition, reason for selling, hostel block or department for pickup..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="seller-submit-bar">
                                    <button
                                        type="submit"
                                        className="submit-listing-btn"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Publishing Listing..." : "🚀 Publish Product to BUY Page"}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-listing-btn"
                                        onClick={() => setActiveTab("BUY")}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                )}
            </main>

            {/* Interactive Chat with Seller Modal */}
            {activeChatProduct && (
                <ChatModal
                    product={activeChatProduct}
                    currentUserEmail={currentUserEmail}
                    onClose={() => setActiveChatProduct(null)}
                />
            )}

            {/* Cart Drawer / Modal */}
            {isCartOpen && (
                <CartModal
                    cart={cart}
                    onUpdateQuantity={handleUpdateCartQuantity}
                    onRemoveItem={handleRemoveCartItem}
                    onClearCart={handleClearCart}
                    onClose={() => setIsCartOpen(false)}
                />
            )}

            {/* Seller Notifications Drawer / Modal */}
            {isNotifOpen && (
                <NotificationModal
                    notifications={notifications}
                    onMarkAsRead={handleMarkNotifAsRead}
                    onMarkAllAsRead={handleMarkAllNotifsAsRead}
                    onClose={() => setIsNotifOpen(false)}
                />
            )}
        </div>
    );
}

export default Home;
