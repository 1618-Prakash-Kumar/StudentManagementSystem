import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ImagePlus, Menu, MessageCircle, Package, X } from "lucide-react";
import CartModal from "./CartModal";
import NotificationModal from "./NotificationModal";
import "../styles/Home.css";
import API_BASE_URL from "../api";

function MarketplaceIcon({ name }) {
    const paths = {
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        cart: (
            <>
                <path d="M3 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
            </>
        ),
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        shield: (
            <>
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
        close: (
            <>
                <path d="m18 6-12 12" />
                <path d="m6 6 12 12" />
            </>
        ),
        image: (
            <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
            </>
        ),
    };

    return (
        <svg
            className="marketplace-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {paths[name]}
        </svg>
    );
}

const formatPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});

const MAX_PRODUCT_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

function SelectedImagePreview({ file, onRemove }) {
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="listing-image-preview">
            {previewUrl && <img src={previewUrl} alt={`Preview of ${file.name}`} />}
            <span title={file.name}>{file.name}</span>
            <button type="button" onClick={onRemove} aria-label={`Remove ${file.name}`}>
                <X size={16} />
            </button>
        </div>
    );
}

function ProductCardImage({ product }) {
    const [failed, setFailed] = useState(false);
    const imageUrl = product.thumbnailUrl || product.imageUrls?.[0];

    if (!imageUrl || failed) {
        return (
            <div className="product-image-placeholder" role="img" aria-label="No product image available">
                <MarketplaceIcon name="image" />
                <span>No image available</span>
            </div>
        );
    }

    return (
        <div className="product-image-placeholder product-image-loaded">
            <img
                src={imageUrl}
                alt={product.title ? `${product.title} listing` : "Product listing"}
                onError={() => setFailed(true)}
            />
        </div>
    );
}

function Home() {
    const navigate = useNavigate();
    const location = useLocation();

    // Mode state: 'BUY' (default) or 'SELL'
    const [activeTab, setActiveTab] = useState("BUY");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Product state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
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
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageValidationError, setImageValidationError] = useState("");
    const [isImageDragOver, setIsImageDragOver] = useState(false);

    // Modals state
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Cart state
    const [cart, setCart] = useState({ items: [], totalItems: 0, grandTotal: 0 });
    const [cartToast, setCartToast] = useState("");

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const unreadMessageFailures = useRef(0);
    const nextUnreadMessageRetryAt = useRef(0);
    const unreadMessageErrorLogged = useRef(false);

    // Current user info
    const currentUserEmail = localStorage.getItem("userEmail") || "";
    const userRole = localStorage.getItem("userRole") || "USER";
    const displayRole = userRole
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());

    // Check if redirected from another route requesting sell mode
    useEffect(() => {
        if (location.pathname === "/create-product") {
            setActiveTab("SELL");
        }
    }, [location.pathname]);

    // Fetch products
    const fetchProducts = useCallback(async (searchQuery = appliedSearch, signal) => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
            const response = await fetch(`${API_BASE_URL}/api/products${query}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal,
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }
                let message = "Unable to load marketplace listings";
                try {
                    const errorResponse = await response.json();
                    message = errorResponse.message || message;
                } catch {
                    message = response.statusText || message;
                }
                throw new Error(message);
            }

            const data = await response.json();
            if (!signal?.aborted) {
                setProducts(data);
                setError("");
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                setError(err.message || "Failed to load products");
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [appliedSearch, navigate]);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories`);
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
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
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
            const response = await fetch(`${API_BASE_URL}/api/notifications`, {
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

    const fetchUnreadMessages = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token || Date.now() < nextUnreadMessageRetryAt.current) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/conversations/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }
                const retryDelay = Math.min(30000 * (2 ** unreadMessageFailures.current), 300000);
                nextUnreadMessageRetryAt.current = Date.now() + retryDelay;
                unreadMessageFailures.current += 1;
                if (!unreadMessageErrorLogged.current) {
                    console.error(
                        `Unread message count request failed (HTTP ${response.status}); retrying in ${Math.round(retryDelay / 1000)} seconds.`
                    );
                    unreadMessageErrorLogged.current = true;
                }
                return;
            }
            const data = await response.json();
            setUnreadMessageCount(data.unreadCount || 0);
            unreadMessageFailures.current = 0;
            nextUnreadMessageRetryAt.current = 0;
            unreadMessageErrorLogged.current = false;
        } catch (err) {
            const retryDelay = Math.min(30000 * (2 ** unreadMessageFailures.current), 300000);
            nextUnreadMessageRetryAt.current = Date.now() + retryDelay;
            unreadMessageFailures.current += 1;
            if (!unreadMessageErrorLogged.current) {
                console.error(
                    `Unread message count request failed; retrying in ${Math.round(retryDelay / 1000)} seconds.`,
                    err
                );
                unreadMessageErrorLogged.current = true;
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchCategories();
        fetchCart();
        fetchNotifications();
        fetchUnreadMessages();

        // Refresh notification badges periodically while the marketplace is open.
        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadMessages();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchUnreadMessages]);

    useEffect(() => {
        const controller = new AbortController();
        fetchProducts(appliedSearch, controller.signal);
        return () => controller.abort();
    }, [appliedSearch, fetchProducts]);

    // Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        navigate("/login");
    };

    const openSellerConversation = (product) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { state: { from: `/messages?productId=${product.id}` } });
            return;
        }

        navigate(`/messages?productId=${product.id}`);
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
            const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
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
            setCartToast(`Added ${qtyToAdd} unit(s) of "${product.title}" to cart. Seller notified.`);
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
            const response = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
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
            const response = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
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
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
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
            const response = await fetch(`${API_BASE_URL}/api/notifications/${notifId}/read`, {
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
            const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
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
            const requestBody = {
                title,
                description,
                price: Number(price),
                quantity: Number(quantity),
                status,
                categoryId: Number(categoryId),
                productCondition: condition,
            };
            let requestBodyContent;
            if (selectedImages.length > 0) {
                const formData = new FormData();
                formData.append(
                    "product",
                    new Blob([JSON.stringify(requestBody)], { type: "application/json" })
                );
                selectedImages.forEach((image) => formData.append("images", image));
                requestBodyContent = formData;
            } else {
                requestBodyContent = new Blob(
                    [JSON.stringify(requestBody)],
                    { type: "application/json" }
                );
            }
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: requestBodyContent,
            });

            if (!response.ok) {
                let errorMessage = "Failed to list the product";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Reset form
            setTitle("");
            setDescription("");
            setPrice("");
            setQuantity("1");
            setStatus("AVAILABLE");
            setCondition("GOOD");
            setSelectedImages([]);
            setImageValidationError("");
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

    const addSelectedImages = (files) => {
        setImageValidationError("");
        const nextImages = selectedImages.slice();
        const errors = [];

        Array.from(files).forEach((file) => {
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                errors.push(`${file.name}: choose a JPEG or PNG image.`);
            } else if (file.size > MAX_IMAGE_SIZE) {
                errors.push(`${file.name}: image must be 5 MB or smaller.`);
            } else if (nextImages.length >= MAX_PRODUCT_IMAGES) {
                errors.push(`A listing can include up to ${MAX_PRODUCT_IMAGES} images.`);
            } else if (!nextImages.some((selected) =>
                selected.name === file.name && selected.size === file.size
                    && selected.lastModified === file.lastModified)) {
                nextImages.push(file);
            }
        });

        setSelectedImages(nextImages);
        if (errors.length) setImageValidationError(errors.join(" "));
    };

    // Filter and Sort products
    const processedProducts = useMemo(() => {
        let list = products.filter((item) => {
            const matchesCategory =
                selectedCategory === "ALL" ||
                (item.categoryName && item.categoryName.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

            return matchesCategory;
        });

        if (sortBy === "PRICE_ASC") {
            list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortBy === "PRICE_DESC") {
            list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
        }

        return list;
    }, [products, selectedCategory, sortBy]);

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
                    <button type="button" className="brand-logo" onClick={() => setActiveTab("BUY")} aria-label="College Exchange home">
                        <span className="brand-mark" aria-hidden="true">CE</span>
                        <span className="brand-text">
                            <span className="brand-title">College Exchange</span>
                        </span>
                    </button>

                    <nav className="mode-tabs desktop-mode-tabs" aria-label="Marketplace">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "BUY" ? "active-buy" : ""}`}
                            onClick={() => setActiveTab("BUY")}
                            aria-current={activeTab === "BUY" ? "page" : undefined}
                        >
                            Browse
                        </button>
                        <button
                            type="button"
                            className={`tab-btn sell-tab-btn ${activeTab === "SELL" ? "active-sell" : ""}`}
                            onClick={() => setActiveTab("SELL")}
                            aria-current={activeTab === "SELL" ? "page" : undefined}
                        >
                            Sell
                        </button>
                    </nav>

                    <button
                        type="button"
                        className="mobile-menu-toggle"
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="marketplace-navigation"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                    >
                        {mobileMenuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
                    </button>
                </div>

                {activeTab === "BUY" && (
                    <form
                        className="navbar-search"
                        role="search"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setAppliedSearch(searchTerm.trim());
                        }}
                    >
                        <MarketplaceIcon name="search" />
                        <input
                            aria-label="Search marketplace listings"
                            type="text"
                            placeholder="Search books, electronics, cycles..."
                            maxLength={100}
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                if (!event.target.value) setAppliedSearch("");
                            }}
                        />
                        {(searchTerm || appliedSearch) && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() => {
                                    setSearchTerm("");
                                    setAppliedSearch("");
                                }}
                                aria-label="Clear search"
                            >
                                <MarketplaceIcon name="close" />
                            </button>
                        )}
                        <button type="submit" className="search-submit-btn" aria-label="Search listings">
                            Search
                        </button>
                    </form>
                )}

                <nav
                    id="marketplace-navigation"
                    className={`navbar-right ${mobileMenuOpen ? "is-open" : ""}`}
                    aria-label="Account and marketplace actions"
                >
                    <div className="mode-tabs mobile-mode-tabs" role="group" aria-label="Marketplace">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "BUY" ? "active-buy" : ""}`}
                            onClick={() => {
                                setActiveTab("BUY");
                                setMobileMenuOpen(false);
                            }}
                            aria-current={activeTab === "BUY" ? "page" : undefined}
                        >
                            Browse
                        </button>

                        <button
                            type="button"
                            className={`tab-btn sell-tab-btn ${activeTab === "SELL" ? "active-sell" : ""}`}
                            onClick={() => {
                                setActiveTab("SELL");
                                setMobileMenuOpen(false);
                            }}
                            aria-current={activeTab === "SELL" ? "page" : undefined}
                        >
                            Sell
                        </button>
                    </div>

                    <button
                        type="button"
                        className="nav-messages-btn"
                        onClick={() => {
                            navigate("/messages");
                            setMobileMenuOpen(false);
                        }}
                        aria-label={`Messages${unreadMessageCount > 0 ? `, ${unreadMessageCount} unread` : ""}`}
                    >
                        <MessageCircle size={18} aria-hidden="true" />
                        <span>Messages</span>
                        {unreadMessageCount > 0 && (
                            <span className="message-badge-count">
                                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        className="nav-messages-btn nav-my-listings-btn"
                        onClick={() => {
                            navigate("/my-listings");
                            setMobileMenuOpen(false);
                        }}
                        aria-label="Open My Listings"
                    >
                        <Package size={18} aria-hidden="true" />
                        <span>My Listings</span>
                    </button>

                    <button
                        type="button"
                        className="nav-cart-btn"
                        onClick={() => {
                            setIsCartOpen(true);
                            setMobileMenuOpen(false);
                        }}
                        aria-label={`Cart${cart.totalItems > 0 ? `, ${cart.totalItems} items` : ""}`}
                    >
                        <MarketplaceIcon name="cart" />
                        <span>Cart</span>
                        {cart.totalItems > 0 && (
                            <span className="cart-badge-count">{cart.totalItems}</span>
                        )}
                    </button>

                    {/* Seller Notifications Button with Unread Badge */}
                    <button
                        type="button"
                        className={`nav-notif-btn ${unreadNotifCount > 0 ? "has-unread" : ""}`}
                        onClick={() => {
                            setIsNotifOpen(true);
                            setMobileMenuOpen(false);
                        }}
                        aria-label={`Notifications${unreadNotifCount > 0 ? `, ${unreadNotifCount} unread` : ""}`}
                    >
                        <MarketplaceIcon name="bell" />
                        <span>Alerts</span>
                        {unreadNotifCount > 0 && (
                            <span className="notif-badge-count">{unreadNotifCount}</span>
                        )}
                    </button>

                    {/* Admin Panel Quick Link (Visible only for ADMIN role) */}
                    {userRole === "ADMIN" && (
                        <button
                            type="button"
                            className="nav-admin-btn"
                            onClick={() => {
                                navigate("/admin");
                                setMobileMenuOpen(false);
                            }}
                            aria-label="Open admin panel"
                        >
                            <MarketplaceIcon name="shield" />
                            <span>Admin</span>
                        </button>
                    )}

                    <div className="user-profile-badge">
                        <span className="user-avatar-circle">
                            {(currentUserEmail || "U").charAt(0).toUpperCase()}
                        </span>
                        <div className="user-info-text">
                            <span className="user-email">{currentUserEmail || "Account"}</span>
                            <span className="user-role-badge">
                                {displayRole}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="nav-logout-btn"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                        }}
                    >
                        <MarketplaceIcon name="logout" />
                        <span>Log out</span>
                    </button>
                </nav>
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
                                <MarketplaceIcon name="plus" />
                                <span>Sell an item</span>
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
                                <label htmlFor="price-sort-select">Sort by</label>
                                <select
                                    id="price-sort-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="price-sort-dropdown"
                                >
                                    <option value="DEFAULT">Newest first</option>
                                    <option value="PRICE_ASC">Price: low to high</option>
                                    <option value="PRICE_DESC">Price: high to low</option>
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
                                <h3>{appliedSearch ? "No products found" : "No listings found"}</h3>
                                <p>
                                    {appliedSearch || selectedCategory !== "ALL"
                                        ? "Try another keyword or adjust the selected category filter."
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
                                        <article className="product-card" key={product.id}>
                                            <ProductCardImage product={product} />

                                            <div className="product-card-content">
                                                <div className="product-card-heading">
                                                    <span className="product-price">
                                                        {formatPrice.format(Number(product.price))}
                                                    </span>
                                                    <h3 className="product-title">{product.title}</h3>
                                                </div>

                                                <div className="product-meta">
                                                    <span>{product.categoryName || "General"}</span>
                                                    <span>{(product.productCondition || "GOOD").replaceAll("_", " ")}</span>
                                                </div>
                                                <p className={`product-availability ${isAvailable ? "in-stock" : ""}`}>
                                                    {isAvailable
                                                        ? `${product.quantity} available`
                                                        : isAvailableSoon
                                                            ? "Available soon"
                                                            : isNotAvailable
                                                                ? "Out of stock"
                                                                : product.status}
                                                </p>
                                                {product.description && (
                                                    <p className="product-desc">{product.description}</p>
                                                )}
                                            </div>

                                            <div className="card-seller-section">
                                                <div className="seller-meta">
                                                    <div className="seller-text">
                                                        <span className="seller-name">
                                                            {product.sellerName || "Seller"}
                                                            {isOwnProduct && <span className="you-badge"> (You)</span>}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="seller-contact-details">
                                                    {product.sellerPhone && (
                                                        <div className="contact-line">
                                                            <a href={`tel:${product.sellerPhone}`}>
                                                                {product.sellerPhone}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {product.sellerEmail && (
                                                        <div className="contact-line">
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
                                                            Add to cart
                                                        </button>
                                                    </div>
                                                ) : isAvailableSoon ? (
                                                    <button type="button" className="cart-disabled-btn soon" disabled>
                                                        Available soon
                                                    </button>
                                                ) : (
                                                    <button type="button" className="cart-disabled-btn out" disabled>
                                                        Out of stock
                                                    </button>
                                                )}
                                            </div>

                                            {/* Card Action Buttons: Chat & WhatsApp */}
                                            <div className="card-actions">
                                                {!isOwnProduct && (
                                                    <button
                                                        type="button"
                                                        className="chat-action-btn"
                                                        onClick={() => openSellerConversation(product)}
                                                    >
                                                        Message seller
                                                    </button>
                                                )}

                                                {product.sellerPhone && (
                                                    <a
                                                        href={`https://wa.me/${product.sellerPhone.replace(/[^0-9]/g, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="whatsapp-action-btn"
                                                        aria-label={`Contact ${product.sellerName || "seller"} on WhatsApp`}
                                                    >
                                                        WhatsApp
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
                                <section className="listing-image-section" aria-labelledby="listing-image-heading">
                                    <div className="listing-image-section-heading">
                                        <h3 id="listing-image-heading">Product photos</h3>
                                        <span>Optional · up to {MAX_PRODUCT_IMAGES} images</span>
                                    </div>
                                    <label
                                        className={`listing-image-dropzone ${isImageDragOver ? "is-drag-over" : ""}`}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            setIsImageDragOver(true);
                                        }}
                                        onDragLeave={(event) => {
                                            event.preventDefault();
                                            setIsImageDragOver(false);
                                        }}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            setIsImageDragOver(false);
                                            addSelectedImages(event.dataTransfer.files);
                                        }}
                                    >
                                        <ImagePlus size={25} aria-hidden="true" />
                                        <span className="listing-image-dropzone-title">Choose or drop product photos</span>
                                        <span className="listing-image-dropzone-hint">JPEG or PNG · up to 5 MB each · maximum 5 images</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            multiple
                                            onChange={(event) => {
                                                addSelectedImages(event.target.files);
                                                event.target.value = "";
                                            }}
                                        />
                                    </label>
                                    {imageValidationError && (
                                        <p className="listing-image-error" role="alert">{imageValidationError}</p>
                                    )}
                                    {selectedImages.length > 0 && (
                                        <div className="listing-image-previews">
                                            {selectedImages.map((file, index) => (
                                                <SelectedImagePreview
                                                    key={`${file.name}-${file.lastModified}-${index}`}
                                                    file={file}
                                                    onRemove={() => setSelectedImages((current) =>
                                                        current.filter((_, imageIndex) => imageIndex !== index))}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>

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
                                        {submitting ? "Publishing listing and photos..." : "🚀 Publish Product to BUY Page"}
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
