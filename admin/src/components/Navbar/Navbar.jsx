import "./Navbar.css";

const Navbar = () => {
  const admin = JSON.parse(localStorage.getItem("admin"));

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    window.location.href = "/login";
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <h2>Admin Panel</h2>
      </div>

      <div className="navbar-right">
        <input type="text" placeholder="Search..." />

        <div className="profile">
          <img src="https://i.pravatar.cc/40" alt="admin" />
          <span>{admin?.name || "Admin"}</span>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;