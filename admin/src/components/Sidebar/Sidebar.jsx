import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h2 className="logo">Ludo Admin</h2>

      <nav>
        <Link
          to="/dashboard"
          className={location.pathname === "/dashboard" ? "active" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/users"
          className={location.pathname === "/users" ? "active" : ""}
        >
          Users
        </Link>

        <Link
          to="/deposit"
          className={location.pathname === "/deposit" ? "active" : ""}
        >
          Deposit
        </Link>

        <Link
          to="/withdraw"
          className={location.pathname === "/withdraw" ? "active" : ""}
        >
          Withdraw
        </Link>

        <Link
          to="/matches"
          className={location.pathname === "/matches" ? "active" : ""}
        >
          Matches
        </Link>

        {/* SETTINGS */}
        <Link
          to="/settings"
          className={location.pathname === "/settings" ? "active" : ""}
        >
          Settings
        </Link>

        {/* PAYMENT CONTROL */}
        <Link
          to="/payment"
          className={location.pathname === "/payment" ? "active" : ""}
        >
          Payment Control
        </Link>

        {/* ✅ ADMIN CONTROL */}
        <Link
          to="/admin-control"
          className={location.pathname === "/admin-control" ? "active" : ""}
        >
          Admin Control
        </Link>
      </nav>

      {/* Logout */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Sidebar;