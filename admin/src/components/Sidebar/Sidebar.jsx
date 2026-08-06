import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

/* ---------- inline icon set ---------- */
const ICON_PATHS = {
  dashboard: (
    <path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10 4h8v4h-8v-4Z" />
  ),
  users: (
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M13 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
  ),
  kyc: (
    <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5M14 3l7 7v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v7h7M8 13h4M8 17h4M8 9h1" />
  ),
  deposit: (
    <path d="M12 5v14M5 12l7 7 7-7" />
  ),
  withdraw: (
    <path d="M12 19V5M5 12l7-7 7 7" />
  ),
  matches: (
    <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.6l-.5 5A4 4 0 0 0 6.18 18a3.5 3.5 0 0 0 2.79-1.38L10 15h4l1.03 1.62A3.5 3.5 0 0 0 17.82 18a4 4 0 0 0 3.98-4.4l-.5-5A4 4 0 0 0 17.32 5Z" />
  ),
  dummy: (
    <path d="M12 2a2 2 0 0 1 2 2c.9.3 1.7.8 2.3 1.5l2.4-.8 1 1.7-2 1.3c.1.5.2 1 .2 1.6v.4l2 1.3-1 1.7-2.4-.8A6.8 6.8 0 0 1 14 15.5c-.6.7-1.4 1.2-2.3 1.5a2 2 0 0 1-3.5 0A6.8 6.8 0 0 1 5.9 15.5l-2.4.8-1-1.7 2-1.3v-.4c0-.6.1-1.1.2-1.6l-2-1.3 1-1.7 2.4.8A6.8 6.8 0 0 1 8.2 6.5C8.8 5.8 9.6 5.3 10.5 5A2 2 0 0 1 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 0 1 0 6 3 3 0 0 1 0-6Z" />
  ),
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-2-1.2L14.4 3h-4l-.5 2.5a7.6 7.6 0 0 0-2 1.2l-2.5-1-2 3.5 2.1 1.6a7.4 7.4 0 0 0 0 2.4L3.4 14.8l2 3.5 2.5-1a7.6 7.6 0 0 0 2 1.2l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2-1.2l2.5 1 2-3.5-2.1-1.6c.07-.4.1-.8.1-1.2Z" />
  ),
  payment: (
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm2 0v3h14V8H5Zm3 7h4" />
  ),
  admin: (
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3ZM9.5 12l1.8 1.8L14.5 10" />
  ),
  tracking: (
    <path d="M9 18V6M9 6l-4 4M9 6l4 4M21 9v6a2 2 0 0 1-2 2h-6M15 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z" />
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
};

const Icon = ({ name, size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICON_PATHS[name] || ICON_PATHS.dashboard}
  </svg>
);

/* ---------- navigation model ----------
   Groups render as expandable sections; their sub-items are the filters
   that used to live inside the pages. Direct links render as-is.
   Sub-items encode their filter in the URL query string, and the pages
   read it via useSearchParams. */
const NAV = [
  {
    label: "Dashboard",
    icon: "dashboard",
    path: "/dashboard",
    items: [
      { label: "All Time", to: "/dashboard", query: { filter: "all" }, isDefault: true },
      { label: "Today", to: "/dashboard", query: { filter: "today" } },
    ],
  },
  {
    label: "Users",
    icon: "users",
    path: "/users",
    items: [
      { label: "All Users", to: "/users", query: { filter: "all" }, isDefault: true },
      { label: "Active", to: "/users", query: { filter: "active" } },
      { label: "Blocked", to: "/users", query: { filter: "blocked" } },
      { label: "Mismatch", to: "/users", query: { filter: "mismatch" } },
    ],
  },
  {
    label: "KYC",
    icon: "kyc",
    path: "/kyc",
    items: [
      { label: "All", to: "/kyc", query: { status: "all" }, isDefault: true },
      { label: "Pending", to: "/kyc", query: { status: "pending" } },
      { label: "Approved", to: "/kyc", query: { status: "approved" } },
      { label: "Rejected", to: "/kyc", query: { status: "rejected" } },
      { label: "Not Submitted", to: "/kyc", query: { status: "not_submitted" } },
    ],
  },
  {
    label: "Deposit",
    icon: "deposit",
    path: "/deposit",
    items: [
      { label: "Pending Deposit", to: "/deposit", query: { tab: "request" }, isDefault: true },
      { label: "Deposit History", to: "/deposit", query: { tab: "history" } },
    ],
  },
  {
    label: "Withdraw",
    icon: "withdraw",
    path: "/withdraw",
    items: [
      { label: "Pending Withdraw", to: "/withdraw", query: { tab: "request" }, isDefault: true },
      { label: "Withdraw History", to: "/withdraw", query: { tab: "history" } },
    ],
  },
  {
    label: "Matches",
    icon: "matches",
    path: "/matches",
    items: [
      { label: "Running Match", to: "/matches", query: { tab: "running" }, isDefault: true },
      { label: "Pending Match", to: "/matches", query: { tab: "pending" } },
      { label: "Completed Match", to: "/matches", query: { tab: "completed" } },
      { label: "Cancel Match", to: "/matches", query: { tab: "cancelled" } },
      { label: "Total Match", to: "/matches", query: { tab: "total" } },
    ],
  },
  { label: "Dummy Battles", icon: "dummy", to: "/dummy-battles" },
  {
    label: "Settings",
    icon: "settings",
    path: "/settings",
    items: [
      { label: "Bonus", to: "/settings", query: { tab: "bonus" }, isDefault: true },
      { label: "Penalty", to: "/settings", query: { tab: "penalty" } },
      { label: "Bonus Report", to: "/settings", query: { tab: "bonusReport" } },
      { label: "Penalty Report", to: "/settings", query: { tab: "penaltyReport" } },
    ],
  },
  {
    label: "Payment Control",
    icon: "payment",
    path: "/payment",
    items: [
      { label: "Upload Scanner", to: "/payment", query: { tab: "scanner" }, isDefault: true },
      { label: "Upload UPI", to: "/payment", query: { tab: "upi" } },
      { label: "Account Details", to: "/payment", query: { tab: "bank" } },
    ],
  },
  {
    label: "Admin Control",
    icon: "admin",
    path: "/admin-control",
    items: [
      { label: "Website Settings", to: "/admin-control", query: { tab: "website" }, isDefault: true },
      { label: "Add Admin/Agent", to: "/admin-control", query: { tab: "add" } },
      { label: "Admin/Agent Data", to: "/admin-control", query: { tab: "data" } },
      { label: "Permissions", to: "/admin-control", query: { tab: "permission" } },
    ],
  },
  { label: "Client Tracking", icon: "tracking", to: "/client-tracking" },
];

const toURL = (to, query = {}) => {
  const params = new URLSearchParams(query).toString();
  return params ? `${to}?${params}` : to;
};

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(() => new Set());

  // Auto-expand the section matching the current page
  useEffect(() => {
    const current = NAV.find((s) => s.items && s.path === location.pathname);
    if (current) {
      setExpanded((prev) => (prev.has(current.path) ? prev : new Set(prev).add(current.path)));
    }
  }, [location.pathname]);

  const closeMenu = () => setOpen(false);

  // Close the drawer with the Escape key (standard app-drawer behavior)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const isItemActive = (item) => {
    if (location.pathname !== item.to) return false;
    const sp = new URLSearchParams(location.search);
    return Object.entries(item.query || {}).every(([key, value]) => {
      const current = sp.get(key);
      return current === value || (current === null && item.isDefault);
    });
  };

  const isSectionActive = (section) => section.items.some(isItemActive);

  const toggleSection = (section) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(section.path)) next.delete(section.path);
      else next.add(section.path);
      return next;
    });
  };

  const handleSectionClick = (section) => {
    if (location.pathname === section.path) {
      // Already here: collapse the submenu and (on mobile) dismiss the drawer
      toggleSection(section);
      closeMenu();
      return;
    }
    // Navigate to the section's default view and expand it
    const first = section.items[0];
    setExpanded((prev) => new Set(prev).add(section.path));
    navigate(toURL(first.to, first.query));
    closeMenu();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-badge">AD</span>
          <h2 className="logo">Ludo Admin</h2>
          <button
            type="button"
            className="sidebar-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((section) => {
            // ---- direct link ----
            if (!section.items) {
              const active = location.pathname === section.to;
              return (
                <Link
                  key={section.to}
                  to={section.to}
                  onClick={closeMenu}
                  className={`nav-item nav-direct ${active ? "active" : ""}`}
                >
                  <Icon name={section.icon} />
                  <span>{section.label}</span>
                </Link>
              );
            }

            // ---- group with sub-items ----
            const openGroup = expanded.has(section.path);
            const active = isSectionActive(section);
            const itemCount = section.items.length;

            return (
              <div key={section.path} className="nav-group">
                <div className={`nav-group-head ${active ? "active" : ""}`}>
                  <button
                    type="button"
                    className="nav-item nav-group-label"
                    onClick={() => handleSectionClick(section)}
                    aria-expanded={openGroup}
                  >
                    <Icon name={section.icon} />
                    <span>{section.label}</span>
                    <span className="nav-badge-count">{itemCount}</span>
                  </button>

                  <button
                    type="button"
                    className={`nav-chevron-btn ${openGroup ? "rotated" : ""}`}
                    onClick={() => toggleSection(section)}
                    aria-label={openGroup ? "Collapse" : "Expand"}
                    aria-expanded={openGroup}
                  >
                    <Icon name="chevron" size={14} />
                  </button>
                </div>

                <div className={`nav-subitems ${openGroup ? "show" : ""}`}>
                  <div className="nav-subitems-inner">
                    {section.items.map((item) => {
                      const itemActive = isItemActive(item);
                      return (
                        <Link
                          key={item.label}
                          to={toURL(item.to, item.query)}
                          onClick={closeMenu}
                          className={`nav-subitem ${itemActive ? "active" : ""}`}
                        >
                          <span className="nav-subitem-dot" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
