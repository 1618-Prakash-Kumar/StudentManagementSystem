import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Image, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import API_BASE_URL from "../api";
import "../styles/MyListings.css";

const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
});

function getErrorMessage(response, fallback) {
    return response.json()
        .then((body) => body?.message || fallback)
        .catch(() => fallback);
}

function ListingImage({ listing }) {
    const [failed, setFailed] = useState(false);
    const source = listing.thumbnailUrl || listing.imageUrls?.[0];

    if (!source || failed) {
        return (
            <div className="my-listing-image-placeholder" role="img" aria-label="No listing image available">
                <Image size={28} aria-hidden="true" />
                <span>No image</span>
            </div>
        );
    }

    return (
        <img
            className="my-listing-image"
            src={source}
            alt={listing.title}
            onError={() => setFailed(true)}
        />
    );
}

function MyListingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [listings, setListings] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(location.state?.notice || "");

    const loadListings = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true, state: { from: location.pathname } });
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/my-listings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true, state: { from: location.pathname } });
                return;
            }
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "Unable to load your listings."));
            }
            setListings(await response.json());
        } catch (loadError) {
            setError(loadError.message || "Unable to load your listings.");
        } finally {
            setLoading(false);
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const activeCount = useMemo(
        () => listings.filter((item) => item.quantity > 0 && item.status === "AVAILABLE").length,
        [listings],
    );
    const filteredListings = useMemo(() => {
        if (filter === "AVAILABLE") {
            return listings.filter((item) => item.quantity > 0 && item.status === "AVAILABLE");
        }
        if (filter === "INACTIVE") {
            return listings.filter((item) => item.quantity <= 0 || item.status !== "AVAILABLE");
        }
        return listings;
    }, [filter, listings]);

    const deleteListing = async (listing) => {
        if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true, state: { from: location.pathname } });
            return;
        }

        setDeletingId(listing.id);
        setError("");
        setNotice("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${listing.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true, state: { from: location.pathname } });
                return;
            }
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "Unable to delete this listing."));
            }
            setListings((current) => current.filter((item) => item.id !== listing.id));
            setNotice(`"${listing.title}" was deleted.`);
        } catch (deleteError) {
            setError(deleteError.message || "Unable to delete this listing.");
        } finally {
            setDeletingId(null);
        }
    };

    const updateAvailability = async (listing) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true, state: { from: location.pathname } });
            return;
        }
        const nextStatus = listing.status === "AVAILABLE" ? "NOT_AVAILABLE" : "AVAILABLE";
        if (nextStatus === "AVAILABLE" && listing.quantity <= 0) {
            setError("Add stock to this listing before making it available.");
            setNotice("");
            return;
        }

        setUpdatingAvailabilityId(listing.id);
        setError("");
        setNotice("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${listing.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: listing.title,
                    description: listing.description || "",
                    price: listing.price,
                    quantity: listing.quantity,
                    categoryId: listing.categoryId,
                    productCondition: listing.productCondition,
                    status: nextStatus,
                }),
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true, state: { from: location.pathname } });
                return;
            }
            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "Unable to update listing availability."));
            }
            const updatedListing = await response.json();
            setListings((current) => current.map((item) =>
                item.id === listing.id ? updatedListing : item));
            setNotice(`"${listing.title}" is now ${nextStatus === "AVAILABLE" ? "available" : "unavailable"}.`);
        } catch (updateError) {
            setError(updateError.message || "Unable to update listing availability.");
        } finally {
            setUpdatingAvailabilityId(null);
        }
    };

    return (
        <main className="my-listings-page">
            <header className="my-listings-header">
                <button type="button" className="my-listings-back" onClick={() => navigate("/home")}>
                    <ArrowLeft size={17} aria-hidden="true" />
                    Marketplace
                </button>
                <div className="my-listings-heading">
                    <div>
                        <p className="my-listings-eyebrow">College Exchange</p>
                        <h1>My Listings</h1>
                        <p className="my-listings-description">Manage the products you have shared with the campus.</p>
                    </div>
                    <button type="button" className="my-listings-primary" onClick={() => navigate("/create-product")}>
                        <Plus size={18} aria-hidden="true" />
                        Add New Listing
                    </button>
                </div>
            </header>

            <section className="my-listings-content" aria-label="Your listings">
                <div className="my-listings-summary">
                    <div><span>Total listings</span><strong>{listings.length}</strong></div>
                    <div><span>Active listings</span><strong>{activeCount}</strong></div>
                </div>

                {notice && <div className="my-listings-notice" role="status">{notice}</div>}
                {error && <div className="my-listings-error" role="alert">{error}</div>}

                <div className="my-listings-filters" role="tablist" aria-label="Filter listings">
                    {[
                        ["ALL", "All Listings"],
                        ["AVAILABLE", "Available"],
                        ["INACTIVE", "Out of Stock / Inactive"],
                    ].map(([value, label]) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={filter === value}
                            className={filter === value ? "selected" : ""}
                            key={value}
                            onClick={() => setFilter(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="my-listings-state" role="status">Loading your listings...</div>
                ) : listings.length === 0 ? (
                    <div className="my-listings-empty">
                        <PackagePlus size={34} aria-hidden="true" />
                        <h2>You haven't listed any products yet</h2>
                        <p>Create your first listing to share it with other students.</p>
                        <button type="button" className="my-listings-primary" onClick={() => navigate("/create-product")}>
                            Add your first listing
                        </button>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="my-listings-state">There are no listings in this section.</div>
                ) : (
                    <div className="my-listings-grid">
                        {filteredListings.map((listing) => {
                            const available = listing.quantity > 0 && listing.status === "AVAILABLE";
                            const statusLabel = listing.quantity <= 0 && listing.status === "AVAILABLE"
                                ? "Out of stock"
                                : ({
                                    AVAILABLE: "Available",
                                    NOT_AVAILABLE: "Out of stock",
                                    AVAILABLE_SOON: "Available soon",
                                    RESERVED: "Reserved",
                                    SOLD: "Sold",
                                }[listing.status] || "Inactive");
                            return (
                                <article className="my-listing-card" key={listing.id}>
                                    <ListingImage listing={listing} />
                                    <div className="my-listing-body">
                                        <div className="my-listing-title-row">
                                            <h2>{listing.title}</h2>
                                            <span className={`my-listing-status ${available ? "available" : "unavailable"}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <strong className="my-listing-price">{currency.format(listing.price)}</strong>
                                        <dl className="my-listing-details">
                                            <div><dt>Category</dt><dd>{listing.categoryName || "—"}</dd></div>
                                            <div><dt>Stock</dt><dd>{listing.quantity ?? 0}</dd></div>
                                            {listing.productCondition && (
                                                <div><dt>Condition</dt><dd>{listing.productCondition.replaceAll("_", " ")}</dd></div>
                                            )}
                                            {listing.createdAt && (
                                                <div><dt>Listed</dt><dd>{new Date(listing.createdAt).toLocaleDateString()}</dd></div>
                                            )}
                                        </dl>
                                        <div className="my-listing-actions">
                                            <button
                                                type="button"
                                                className="my-listing-availability"
                                                onClick={() => updateAvailability(listing)}
                                                disabled={updatingAvailabilityId === listing.id
                                                    || deletingId === listing.id
                                                    || (listing.status !== "AVAILABLE" && listing.quantity <= 0)}
                                                title={listing.quantity <= 0 && listing.status !== "AVAILABLE"
                                                    ? "Add stock before making this listing available"
                                                    : ""}
                                            >
                                                {updatingAvailabilityId === listing.id
                                                    ? "Updating..."
                                                    : available ? "Mark unavailable" : "Mark available"}
                                            </button>
                                            <button
                                                type="button"
                                                className="my-listing-edit"
                                                onClick={() => navigate(`/my-listings/${listing.id}/edit`)}
                                            >
                                                <Pencil size={15} aria-hidden="true" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="my-listing-delete"
                                                onClick={() => deleteListing(listing)}
                                                disabled={deletingId === listing.id || updatingAvailabilityId === listing.id}
                                            >
                                                <Trash2 size={15} aria-hidden="true" />
                                                {deletingId === listing.id ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}

export default MyListingsPage;
