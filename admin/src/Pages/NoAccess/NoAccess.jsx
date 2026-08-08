import { useNavigate } from "react-router-dom";
import "./NoAccess.css";

const NoAccess = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  return (
    <div className="no-access-page">
      <div className="no-access-card">
        <div className="no-access-icon">🔒</div>
        <h1>No Access</h1>
        <p>
          Aapke account ko koi section permission nahi di gayi hai.
          <br />
          Admin se contact karke permissions dilwao.
        </p>
        <button className="no-access-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default NoAccess;
