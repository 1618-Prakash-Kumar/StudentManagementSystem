import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPanel.css";

function AdminPanel() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("ALL");

    // Add User Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newRole, setNewRole] = useState("USER");
    const [creatingUser, setCreatingUser] = useState(false);

    // Current Admin metadata
    const token = localStorage.getItem("token");
    const currentUserEmail = localStorage.getItem("userEmail") || "";
    const currentUserRole = localStorage.getItem("userRole") || "";

    const isAuthorized = token && (currentUserRole === "ADMIN");

    // Fetch all users
    const fetchUsers = async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("https://collegeexchange-backend.onrender.com/api/admin/users", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 403 || response.status === 401) {
                setError("Access Denied: You do not have administrator privileges.");
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load users from the server");
            }

            const data = await response.json();
            setUsers(data);
            setError("");
        } catch (err) {
            setError(err.message || "An error occurred while fetching users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [isAuthorized]);

    // Handle Promoted / Role Change
    const handleRoleChange = async (userId, targetRole) => {
        setActionMessage({ type: "", text: "" });

        try {
            const response = await fetch(`https://collegeexchange-backend.onrender.com/api/admin/users/${userId}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: targetRole }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to update user role");
            }

            const updatedUser = await response.json();
            setActionMessage({
                type: "success",
                text: `Successfully changed role for ${updatedUser.fullName} to ${targetRole}.`,
            });

            // Update user in local list
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
            );
        } catch (err) {
            setActionMessage({ type: "error", text: err.message });
        }
    };

    // Handle Create User
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setActionMessage({ type: "", text: "" });
        setCreatingUser(true);

        try {
            const response = await fetch("https://collegeexchange-backend.onrender.com/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullName: newFullName,
                    email: newEmail,
                    password: newPassword,
                    phone: newPhone,
                    role: newRole,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to create user");
            }

            const created = await response.json();
            setActionMessage({
                type: "success",
                text: `User "${created.fullName}" successfully created with role ${created.role}!`,
            });

            // Reset modal & form
            setNewFullName("");
            setNewEmail("");
            setNewPassword("");
            setNewPhone("");
            setNewRole("USER");
            setShowAddModal(false);

            // Refresh user list
            fetchUsers();
        } catch (err) {
            setActionMessage({ type: "error", text: err.message });
        } finally {
            setCreatingUser(false);
        }
    };

    // Handle Delete User
    const handleDeleteUser = async (userId, userFullName, userEmail) => {
        if (userEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
            alert("You cannot delete your own admin account.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to permanently delete user "${userFullName}" (${userEmail})?`
        );
        if (!confirmDelete) return;

        try {
            const response = await fetch(`https://collegeexchange-backend.onrender.com/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to delete user");
            }

            setActionMessage({
                type: "success",
                text: `User "${userFullName}" deleted successfully.`,
            });

            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (err) {
            setActionMessage({ type: "error", text: err.message });
        }
    };

    // Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        navigate("/login");
    };

    // Access Denied Screen for non-admin users
    if (!token || currentUserRole !== "ADMIN") {
        return (
            <div className="admin-access-denied-container">
                <div className="denied-box">
                    <span className="denied-icon">🔒</span>
                    <h2>Access Denied (403 Forbidden)</h2>
                    <p>
                        You do not have Administrator permissions to view or manage the Admin Panel.
                    </p>
                    <div className="denied-actions">
                        <button className="primary-btn" onClick={() => navigate("/home")}>
                            🛍️ Go to Marketplace (BUY/SELL)
                        </button>
                        <button className="secondary-btn" onClick={handleLogout}>
                            Login with Admin Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Filter users for search and role filter
    const filteredUsers = users.filter((u) => {
        const matchesRole =
            filterRole === "ALL" || u.role?.toUpperCase() === filterRole.toUpperCase();

        const matchesSearch =
            !searchQuery ||
            u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phone?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesRole && matchesSearch;
    });

    const totalAdmins = users.filter((u) => u.role === "ADMIN").length;
    const totalRegularUsers = users.filter((u) => u.role !== "ADMIN").length;

    return (
        <div className="admin-panel-container">
            {/* Top Admin Navbar */}
            <header className="admin-navbar">
                <div className="admin-nav-left">
                    <div className="admin-brand" onClick={() => navigate("/home")}>
                        <span className="brand-logo-icon">🛡️</span>
                        <div>
                            <span className="admin-brand-title">College Exchange</span>
                            <span className="admin-brand-sub">Admin Control Center</span>
                        </div>
                    </div>
                </div>

                <div className="admin-nav-right">
                    <button
                        type="button"
                        className="nav-marketplace-btn"
                        onClick={() => navigate("/home")}
                    >
                        🛍️ Go to Marketplace (BUY/SELL)
                    </button>

                    <div className="admin-user-badge">
                        <span className="admin-avatar">👑</span>
                        <div>
                            <span className="admin-email">{currentUserEmail}</span>
                            <span className="admin-role-tag">Super Admin</span>
                        </div>
                    </div>

                    <button type="button" className="admin-logout-btn" onClick={handleLogout}>
                        Logout 🚪
                    </button>
                </div>
            </header>

            <main className="admin-main-content">
                {/* Header Title Section */}
                <div className="admin-header-row">
                    <div>
                        <h1>User & Access Management</h1>
                        <p>Monitor campus accounts, manage permissions, and assign administrator roles.</p>
                    </div>

                    <button
                        type="button"
                        className="admin-add-user-btn"
                        onClick={() => setShowAddModal(true)}
                    >
                        ➕ Add New User
                    </button>
                </div>

                {/* Feedback Alerts */}
                {actionMessage.text && (
                    <div className={`admin-alert ${actionMessage.type}`}>
                        {actionMessage.text}
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="admin-stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon icon-users">👥</div>
                        <div className="stat-info">
                            <span className="stat-num">{users.length}</span>
                            <span className="stat-label">Total Registered Users</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon icon-admin">👑</div>
                        <div className="stat-info">
                            <span className="stat-num">{totalAdmins}</span>
                            <span className="stat-label">Administrators</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon icon-student">🎓</div>
                        <div className="stat-info">
                            <span className="stat-num">{totalRegularUsers}</span>
                            <span className="stat-label">Regular Student Users</span>
                        </div>
                    </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="admin-controls-bar">
                    <div className="admin-search-box">
                        <span>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by user name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-btn" onClick={() => setSearchQuery("")}>
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="admin-role-filter">
                        <label>Role Filter:</label>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admins Only</option>
                            <option value="USER">Users Only</option>
                        </select>
                    </div>

                    <button className="refresh-btn" onClick={fetchUsers} title="Refresh Table">
                        🔄 Refresh
                    </button>
                </div>

                {/* Users Table */}
                <div className="admin-table-card">
                    {loading && (
                        <div className="admin-table-status">
                            <div className="admin-spinner"></div>
                            <p>Loading registered users...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="admin-table-error">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchUsers}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && filteredUsers.length === 0 && (
                        <div className="admin-table-empty">
                            <h3>No matching users found</h3>
                            <p>Try clearing your search query or role filter.</p>
                        </div>
                    )}

                    {!loading && !error && filteredUsers.length > 0 && (
                        <div className="table-responsive">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User Profile</th>
                                        <th>Contact Phone</th>
                                        <th>Current Role</th>
                                        <th>Listings</th>
                                        <th>Registered Date</th>
                                        <th style={{ textAlign: "right" }}>Admin Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const isCurrentUser =
                                            user.email?.toLowerCase() === currentUserEmail.toLowerCase();
                                        const isAdmin = user.role === "ADMIN";

                                        return (
                                            <tr key={user.id} className={isCurrentUser ? "current-user-row" : ""}>
                                                <td>#{user.id}</td>
                                                <td>
                                                    <div className="user-table-cell">
                                                        <span className="user-table-avatar">
                                                            {(user.fullName || "U").charAt(0).toUpperCase()}
                                                        </span>
                                                        <div className="user-table-info">
                                                            <strong>
                                                                {user.fullName}
                                                                {isCurrentUser && (
                                                                    <span className="self-tag"> (You)</span>
                                                                )}
                                                            </strong>
                                                            <span>{user.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{user.phone || "—"}</td>
                                                <td>
                                                    <span
                                                        className={`role-pill ${
                                                            isAdmin ? "role-admin" : "role-user"
                                                        }`}
                                                    >
                                                        {isAdmin ? "👑 ADMIN" : "👤 USER"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="listing-count-badge">
                                                        {user.productCount || 0} items
                                                    </span>
                                                </td>
                                                <td>
                                                    {user.createdAt
                                                        ? new Date(user.createdAt).toLocaleDateString(
                                                              undefined,
                                                              { year: "numeric", month: "short", day: "numeric" }
                                                          )
                                                        : "—"}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="table-actions-group">
                                                        {!isAdmin ? (
                                                            <button
                                                                type="button"
                                                                className="make-admin-btn"
                                                                onClick={() => handleRoleChange(user.id, "ADMIN")}
                                                                title="Promote this user to ADMIN"
                                                            >
                                                                👑 Make ADMIN
                                                            </button>
                                                        ) : !isCurrentUser ? (
                                                            <button
                                                                type="button"
                                                                className="demote-btn"
                                                                onClick={() => handleRoleChange(user.id, "USER")}
                                                                title="Change role to USER"
                                                            >
                                                                👤 Change to USER
                                                            </button>
                                                        ) : (
                                                            <span className="active-admin-label">Protected</span>
                                                        )}

                                                        {!isCurrentUser && (
                                                            <button
                                                                type="button"
                                                                className="delete-user-btn"
                                                                onClick={() =>
                                                                    handleDeleteUser(user.id, user.fullName, user.email)
                                                                }
                                                                title="Delete user"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New User (Admin Provisioning)</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="modal-form">
                            <div className="form-group">
                                <label>
                                    Full Name <span className="star">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={newFullName}
                                    onChange={(e) => setNewFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Email Address <span className="star">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="student@college.edu"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>
                                        Password <span className="star">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Set initial password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    User Role <span className="star">*</span>
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    required
                                >
                                    <option value="USER">USER (Standard Student Buyer/Seller)</option>
                                    <option value="ADMIN">ADMIN (System Administrator)</option>
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={creatingUser}
                                >
                                    {creatingUser ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
