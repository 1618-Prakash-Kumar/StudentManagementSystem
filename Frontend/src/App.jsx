import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Home from "./components/Home";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Register Page */}
                <Route path="/" element={<RegisterForm />} />

                {/* Login Page */}
                <Route path="/login" element={<LoginForm />} />

                {/* Register Page */}
                <Route path="/register" element={<RegisterForm />} />

                {/* Home Page */}
                <Route path="/home" element={<Home />} />

            </Routes>

        </BrowserRouter>

    );

}

export default App;