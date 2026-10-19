import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Home from "./components/Home";
import CreateProduct from "./components/CreateProduct";
import AdminPanel from "./components/AdminPanel";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RegisterForm />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/home" element={<Home />} />
                <Route path="/create-product" element={<CreateProduct />} />
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
