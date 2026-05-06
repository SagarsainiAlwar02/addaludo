import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function FooterNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="bottom-nav">

      <Link to="/support" className={`nav-item ${path === "/support" ? "active" : ""}`}>
        <i className="fa-regular fa-comment-dots"></i>
      </Link>

      <Link to="/refer" className={`nav-item ${path === "/refer" ? "active" : ""}`}>
        <i className="fa-solid fa-mobile-screen-button"></i>
      </Link>

      <Link to="/" className="nav-item-center">
        <i className="fa-solid fa-house"></i>
      </Link>

      <Link to="/wallet" className={`nav-item ${path === "/wallet" ? "active" : ""}`}>
        <i className="fa-solid fa-wallet"></i>
      </Link>

      <Link to="/profile" className={`nav-item ${path === "/profile" ? "active" : ""}`}>
        <i className="fa-solid fa-user-gear"></i>
      </Link>

    </nav>
  );
}