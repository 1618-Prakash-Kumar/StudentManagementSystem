import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Home from "./components/Home";
import CreateProduct from "./components/CreateProduct";
import AdminPanel from "./components/AdminPanel";
import MessagesPage from "./pages/MessagesPage";
import MyListingsPage from "./pages/MyListingsPage";
import EditListingPage from "./pages/EditListingPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RegisterForm />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/home" element={<Home />} />
                <Route path="/create-product" element={<CreateProduct />} />
                <Route path="/my-listings" element={<MyListingsPage />} />
                <Route path="/my-listings/:id/edit" element={<EditListingPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:conversationId" element={<MessagesPage />} />
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
