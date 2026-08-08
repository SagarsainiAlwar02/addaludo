import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import API from "../../api";
import "./Layout.css";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/kyc": "KYC",
  "/deposit": "Deposit",
  "/withdraw": "Withdraw",
  "/matches": "Matches",
  "/dummy-battles": "Dummy Battles",
  "/settings": "Settings",
  "/payment": "Payment Control",
  "/admin-control": "Admin Control",
  "/client-tracking": "Client Tracking",
};

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const location = useLocation();

  // Refresh the session (role + permissions) from the server on load so that
  // permission changes made by the admin apply without needing a re-login.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.get("/admin/me");
        const admin = res.data?.admin || res.data?.data?.admin;
        if (mounted && admin) {
          localStorage.setItem("adminUser", JSON.stringify(admin));
          setTick((t) => t + 1); // re-render sidebar with fresh permissions
        }
      } catch (err) {
        // 401 handled by api interceptor (redirects to /login)
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Lock body scroll while the mobile drawer is open (app-like behavior)
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="admin-layout">
      <Sidebar open={open} setOpen={setOpen} />

      <main className="main-content">
        <header className="mobile-topbar">
          <button
            className="menu-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <span className="menu-icon">
              <span />
              <span />
              <span />
            </span>
          </button>

          <div className="topbar-titles">
            <h3>{PAGE_TITLES[location.pathname] || "Ludo Admin"}</h3>
            <span className="topbar-sub">Admin Panel</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default Layout;
