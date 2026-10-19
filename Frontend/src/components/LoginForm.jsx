import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        const loginData = {
            email,
            password
        };

        try {
            const response = await fetch("https://collegeexchange-backend.onrender.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.message === "Login Successful") {
                localStorage.setItem("token", result.token);
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userRole", result.role || "USER");

                if (result.role === "ADMIN") {
                    navigate("/admin");
                } else {
                    navigate("/home");
                }
            } else {
                setErrorMsg(result.message || "Invalid credentials");
            }
        } catch (error) {
            console.error("ERROR:", error);
            setErrorMsg("Cannot connect to server. Please ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>College Exchange</h1>
                <h2>Student Marketplace Login</h2>

                {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter Student / Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="register-link" style={{ marginTop: "18px", textAlign: "center", color: "#6b7280" }}>
                    Don't have an account?{" "}
                    <span 
                        onClick={() => navigate("/register")} 
                        style={{ color: "#0d6efd", fontWeight: "bold", cursor: "pointer" }}
                    >
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}

export default LoginForm;
