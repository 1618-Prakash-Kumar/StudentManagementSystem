import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateProduct.css";

function CreateProduct() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [condition, setCondition] = useState("GOOD");
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("https://collegeexchange-backend.onrender.com/api/categories");

                if (!response.ok) {
                    throw new Error("Unable to load categories");
                }

                const data = await response.json();
                setCategories(data);

                if (data.length > 0) {
                    setCategoryId(String(data[0].id));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (!categoryId) {
            setError("Select a category before adding a product.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch("https://collegeexchange-backend.onrender.com/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    price: Number(price),
                    categoryId: Number(categoryId),
                    productCondition: condition,
                }),
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Unable to create listing");
            }

            navigate("/home");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="create-product-container">
            <section className="create-product-panel">
                <div className="create-product-header">
                    <div>
                        <p className="eyebrow">College Exchange</p>
                        <h1>Create Listing</h1>
                    </div>

                    <button type="button" className="secondary-button" onClick={() => navigate("/home")}>
                        ← Back to Buy Page
                    </button>
                </div>

                {error && <p className="form-error">{error}</p>}

                {loadingCategories ? (
                    <p className="form-status">Loading categories...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="create-product-form">
                        <label>
                            Product Title
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Example: Java programming book, Casio Calculator"
                                required
                            />
                        </label>

                        <div className="form-row">
                            <label>
                                Price (₹)
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="350"
                                    required
                                />
                            </label>

                            <label>
                                Category
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    disabled={categories.length === 0}
                                    required
                                >
                                    {categories.length === 0 ? (
                                        <option value="">No categories found</option>
                                    ) : (
                                        categories.map((category) => (
                                            <option value={category.id} key={category.id}>
                                                {category.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </label>

                            <label>
                                Condition
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    required
                                >
                                    <option value="NEW">New (Unopened)</option>
                                    <option value="LIKE_NEW">Like New</option>
                                    <option value="GOOD">Good</option>
                                    <option value="FAIR">Fair</option>
                                </select>
                            </label>
                        </div>

                        <label>
                            Description & Pickup Details
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add condition details, semester, hostel block for pickup..."
                                rows="5"
                            />
                        </label>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={submitting || categories.length === 0}
                        >
                            {submitting ? "Publishing..." : "🚀 Publish Product"}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}

export default CreateProduct;
