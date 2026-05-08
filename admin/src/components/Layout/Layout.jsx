import { useState } from "react";
import Sidebar from "./Sidebar";
import "./Layout.css";

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-layout">
      <Sidebar open={open} setOpen={setOpen} />

      <main className="main-content">
        <div className="mobile-topbar">
          <button className="menu-btn" onClick={() => setOpen(true)}>
            ☰
          </button>
          <h3>Ludo Admin</h3>
        </div>

        {children}
      </main>
    </div>
  );
};

export default Layout;