import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function LoginForm() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const loginData = {
            email,
            password
        };

        try {

            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if(result.message === "Login Successful"){
                
                localStorage.setItem("token",result.token);

                alert(result.message);
                if(result.role === "ADMIN"){
                    navigate("/admin");
                }else{
                    navigate("/home");
                }
                

            }else{

                alert(result.message);

            }

            setEmail("");
            setPassword("");

        } catch (error) {

            console.error("ERROR:", error);
            alert(error.message);

        }
    };

    return (

        <div className="login-container">

            <h1>Campus Exchange</h1>

            <h2>Login</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="email"
                    placeholder="Enter Email"
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

                <button type="submit">
                    Login
                </button>

            </form>

        </div>

    );
}

export default LoginForm;