import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const closeMenu = () => {
    if (setOpen) setOpen(false);
  };

  const links = [
    ["Dashboard", "/dashboard"],
    ["Users", "/users"],
    ["KYC", "/kyc"],
    ["Deposit", "/deposit"],
    ["Withdraw", "/withdraw"],
    ["Matches", "/matches"],
       ["Dummy Battles", "/dummy-battles"], 
    ["Settings", "/settings"],
    ["Payment Control", "/payment"],
    ["Admin Control", "/admin-control"],
    ["Client Tracking", "/client-tracking"],
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={closeMenu}
      />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <h2 className="logo">Ludo Admin</h2>

        <nav>
          {links.map(([name, path]) => (
            <Link
              key={path}
              to={path}
              onClick={closeMenu}
              className={location.pathname === path ? "active" : ""}
            >
              {name}
            </Link>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;