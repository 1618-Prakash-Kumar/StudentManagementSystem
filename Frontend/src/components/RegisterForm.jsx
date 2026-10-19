import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

function RegisterForm() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setIsError(false);
        setLoading(true);

        const registerData = {
            fullName,
            email,
            password,
            phone
        };

        try {
            const response = await fetch("https://collegeexchange-backend.onrender.com/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.text();

            if (result === "Registration Successful") {
                setMessage("Registration successful! Redirecting to login...");
                setIsError(false);
                setTimeout(() => {
                    navigate("/login");
                }, 1200);
            } else {
                setMessage(result);
                setIsError(true);
            }
        } catch (error) {
            console.error("ERROR:", error);
            setMessage("Failed to connect to backend server");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f4f6f9" }}>
            <div className="register-container">
                <h1>College Exchange</h1>
                <h2>Create Student Account</h2>

                {message && (
                    <div style={{
                        padding: "10px",
                        marginBottom: "15px",
                        borderRadius: "6px",
                        background: isError ? "#fee2e2" : "#dcfce7",
                        color: isError ? "#b91c1c" : "#15803d",
                        fontWeight: 600,
                        fontSize: "14px",
                        textAlign: "center"
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Full Name (e.g. John Doe)"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />

                    <input
                        type="email"
                        placeholder="Campus / Personal Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <input
                        type="tel"
                        placeholder="Contact Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Create Account"}
                    </button>
                </form>

                <p className="login-link">
                    Already have an account?{" "}
                    <span onClick={() => navigate("/login")}>
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
}

export default RegisterForm;
