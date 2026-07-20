import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

function RegisterForm() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        const registerData = {
            fullName,
            email,
            password,
            phone
        };

        try {

            const response = await fetch("http://localhost:8080/api/auth/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(registerData)

            });

            const result = await response.text();

            alert(result);
            
            if (result === "Registration Successful") {

                navigate("/login");

            }

            setFullName("");
            setEmail("");
            setPassword("");
            setPhone("");

        }catch (error) {
            console.error("ERROR:", error);
            alert(error.message);
        }

    };

    return (

        <div className="register-container">

            <h1>Campus Exchange</h1>

            <h2>Create Account</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />

                <input
                    type="email"
                    placeholder="Email"
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
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />

                <button type="submit">
                    Register
                </button>

            </form>

            <p className="login-link">

                Already have an account?

                <span onClick={() => navigate("/login")}>
                    Login
                </span>

            </p>

        </div>

    );

}

export default RegisterForm;