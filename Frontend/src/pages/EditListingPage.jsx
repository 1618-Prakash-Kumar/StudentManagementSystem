import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Trash2, Upload, X } from "lucide-react";
import API_BASE_URL from "../api";
import "../styles/MyListings.css";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function PendingImagePreview({ file, onRemove }) {
    const [url, setUrl] = useState("");
    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return (
        <div className="my-listing-image-item my-listing-pending-image">
            {url && <img src={url} alt={`Pending image ${file.name}`} />}
            <span>Not uploaded</span>
            <button type="button" aria-label={`Remove selected image ${file.name}`} onClick={onRemove}>
                <X size={16} />
            </button>
        </div>
    );
}

async function errorMessage(response, fallback) {
    return response.json()
        .then((body) => body?.message || fallback)
        .catch(() => fallback);
}

function EditListingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        categoryId: "",
        productCondition: "GOOD",
        quantity: "1",
    });
    const [pendingImages, setPendingImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageBusyId, setImageBusyId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true, state: { from: `/my-listings/${id}/edit` } });
            return;
        }
        setLoading(true);
        setError("");
        try {
            const [productResponse, categoryResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/products/my-listings/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/api/categories`),
            ]);
            if (productResponse.status === 401 || productResponse.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true, state: { from: `/my-listings/${id}/edit` } });
                return;
            }
            if (!productResponse.ok) {
                throw new Error(await errorMessage(productResponse, "Unable to load this listing."));
            }
            if (!categoryResponse.ok) {
                throw new Error(await errorMessage(categoryResponse, "Unable to load product categories."));
            }
            const [listing, categoryList] = await Promise.all([
                productResponse.json(),
                categoryResponse.json(),
            ]);
            setProduct(listing);
            setCategories(categoryList);
            setForm({
                title: listing.title || "",
                description: listing.description || "",
                price: listing.price ?? "",
                categoryId: String(listing.categoryId || ""),
                productCondition: listing.productCondition || "GOOD",
                quantity: String(listing.quantity ?? 0),
            });
        } catch (loadError) {
            setError(loadError.message || "Unable to load this listing.");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setError("");
        setSuccess("");
    };

    const handleSelectImages = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        setError("");
        const currentCount = product?.images?.length || 0;
        if (currentCount + pendingImages.length + files.length > MAX_IMAGES) {
            setError(`A listing can have at most ${MAX_IMAGES} images.`);
            return;
        }
        const invalid = files.find((file) =>
            !ALLOWED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE || file.size === 0
        );
        if (invalid) {
            setError("Choose non-empty JPEG or PNG images no larger than 5 MB each.");
            return;
        }
        setPendingImages((current) => [...current, ...files]);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        if (saving || !product) return;
        setError("");
        setSuccess("");
        const price = Number(form.price);
        const quantity = Number(form.quantity);
        if (!Number.isFinite(price) || price <= 0) {
            setError("Enter a price greater than zero.");
            return;
        }
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000) {
            setError("Stock must be a whole number between 0 and 100000.");
            return;
        }
        if (!form.title.trim() || form.title.length > 150) {
            setError("Enter a title no longer than 150 characters.");
            return;
        }
        if (form.description.length > 1000) {
            setError("Description cannot exceed 1000 characters.");
            return;
        }
        if (!form.categoryId) {
            setError("Select a category.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true, state: { from: `/my-listings/${id}/edit` } });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    price,
                    quantity,
                    categoryId: Number(form.categoryId),
                    productCondition: form.productCondition,
                    status: quantity <= 0
                        ? "NOT_AVAILABLE"
                        : product.status === "NOT_AVAILABLE"
                            ? "AVAILABLE"
                            : product.status,
                }),
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true, state: { from: `/my-listings/${id}/edit` } });
                return;
            }
            if (!response.ok) {
                throw new Error(await errorMessage(response, "Unable to save listing changes."));
            }
            let updatedListing = await response.json();
            setProduct(updatedListing);

            if (pendingImages.length > 0) {
                for (const file of pendingImages) {
                    const imageData = new FormData();
                    imageData.append("image", file);
                    const imageResponse = await fetch(`${API_BASE_URL}/api/products/${id}/images`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: imageData,
                    });
                    if (!imageResponse.ok) {
                        throw new Error(
                            `Listing details were saved, but an image could not be uploaded: ${
                                await errorMessage(imageResponse, "Image upload failed.")
                            }`
                        );
                    }
                    updatedListing = await imageResponse.json();
                    setProduct(updatedListing);
                    setPendingImages((current) => current.filter((selectedFile) => selectedFile !== file));
                }
            }
            setSuccess("Listing changes saved.");
        } catch (saveError) {
            const message = saveError.message || "Unable to save listing changes.";
            await loadData();
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const removeImage = async (image) => {
        if (!window.confirm("Remove this image from the listing?")) return;
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true, state: { from: `/my-listings/${id}/edit` } });
            return;
        }
        setImageBusyId(image.id);
        setError("");
        setSuccess("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${id}/images/${image.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true, state: { from: `/my-listings/${id}/edit` } });
                return;
            }
            if (!response.ok) {
                throw new Error(await errorMessage(response, "Unable to remove this image."));
            }
            setProduct(await response.json());
            setSuccess("Image removed.");
        } catch (removeError) {
            setError(removeError.message || "Unable to remove this image.");
        } finally {
            setImageBusyId(null);
        }
    };

    if (loading) {
        return <main className="my-listings-page"><div className="my-listings-state">Loading listing...</div></main>;
    }
    if (!product) {
        return (
            <main className="my-listings-page">
                <div className="my-listings-error" role="alert">{error || "Listing could not be loaded."}</div>
                <button type="button" className="my-listings-secondary" onClick={() => navigate("/my-listings")}>
                    Back to My Listings
                </button>
            </main>
        );
    }

    return (
        <main className="my-listings-page">
            <header className="my-listings-header">
                <button type="button" className="my-listings-back" onClick={() => navigate("/my-listings")}>
                    <ArrowLeft size={17} aria-hidden="true" /> My Listings
                </button>
                <div className="my-listings-heading">
                    <div>
                        <p className="my-listings-eyebrow">Manage your product</p>
                        <h1>Edit Listing</h1>
                        <p className="my-listings-description">Update the details and images for “{product.title}”.</p>
                    </div>
                </div>
            </header>

            <section className="my-listings-content my-listing-editor">
                {error && <div className="my-listings-error" role="alert">{error}</div>}
                {success && <div className="my-listings-notice" role="status">{success}</div>}
                <form className="my-listing-form" onSubmit={handleSave}>
                    <label>
                        Product title
                        <input name="title" value={form.title} onChange={updateField} maxLength={150} required />
                    </label>
                    <label>
                        Description
                        <textarea name="description" value={form.description} onChange={updateField} maxLength={1000} rows={5} />
                    </label>
                    <div className="my-listing-form-row">
                        <label>
                            Price (₹)
                            <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={updateField} required />
                        </label>
                        <label>
                            Stock quantity
                            <input name="quantity" type="number" min="0" max="100000" step="1" value={form.quantity} onChange={updateField} required />
                        </label>
                        <label>
                            Category
                            <select name="categoryId" value={form.categoryId} onChange={updateField} required>
                                <option value="" disabled>Select a category</option>
                                {categories.map((category) => (
                                    <option value={category.id} key={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Condition
                            <select name="productCondition" value={form.productCondition} onChange={updateField} required>
                                <option value="NEW">New (Unopened)</option>
                                <option value="LIKE_NEW">Like New</option>
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                            </select>
                        </label>
                    </div>

                    <section className="my-listing-images" aria-labelledby="listing-images-title">
                        <div className="my-listing-section-heading">
                            <div>
                                <h2 id="listing-images-title">Product images</h2>
                                <p>JPEG or PNG, up to 5 MB each. Maximum {MAX_IMAGES} images per listing.</p>
                            </div>
                            <label className="my-listing-upload">
                                <ImagePlus size={17} aria-hidden="true" />
                                Select images
                                <input type="file" accept="image/jpeg,image/png" multiple onChange={handleSelectImages} />
                            </label>
                        </div>
                        <div className="my-listing-image-grid">
                            {(product.images || []).map((image) => (
                                <div className="my-listing-image-item" key={image.id}>
                                    <img src={image.imageUrl} alt={`${product.title} listing`} />
                                    <button
                                        type="button"
                                        aria-label="Remove listing image"
                                        onClick={() => removeImage(image)}
                                        disabled={imageBusyId === image.id || saving}
                                    >
                                        {imageBusyId === image.id ? "…" : <Trash2 size={16} />}
                                    </button>
                                </div>
                            ))}
                            {pendingImages.map((file, index) => (
                                <PendingImagePreview
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                    file={file}
                                    onRemove={() => setPendingImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                />
                            ))}
                            {(!product.images || product.images.length === 0) && pendingImages.length === 0 && (
                                <p className="my-listing-no-images">No images have been added to this listing.</p>
                            )}
                        </div>
                    </section>

                    <div className="my-listing-form-actions">
                        <button type="button" className="my-listings-secondary" onClick={() => navigate("/my-listings")} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="my-listings-primary" disabled={saving || imageBusyId !== null}>
                            <Upload size={17} aria-hidden="true" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default EditListingPage;
