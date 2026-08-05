import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function FooterNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-center justify-between bg-[#111827] px-6 py-1 shadow-lg border-t border-slate-800">
      
      {/* Support */}
      <Link 
        to="/support" 
        className={`flex flex-col items-center justify-center transition-all ${
          path === "/support" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-white"
        }`}
      >
        <i className="fa-regular fa-comment-dots text-sm"></i>
      </Link>

      {/* Refer */}
      <Link 
        to="/refer" 
        className={`flex flex-col items-center justify-center transition-all ${
          path === "/refer" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-white"
        }`}
      >
        <i className="fa-solid fa-mobile-screen-button text-sm"></i>
      </Link>

      {/* Center Home Icon */}
      <Link 
        to="/" 
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
          path === "/" 
            ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/40" 
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        <i className="fa-solid fa-house text-xs"></i>
      </Link>

      {/* Wallet */}
      <Link 
        to="/wallet" 
        className={`flex flex-col items-center justify-center transition-all ${
          path === "/wallet" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-white"
        }`}
      >
        <i className="fa-solid fa-wallet text-sm"></i>
      </Link>

      {/* Profile */}
      <Link 
        to="/profile" 
        className={`flex flex-col items-center justify-center transition-all ${
          path === "/profile" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-white"
        }`}
      >
        <i className="fa-solid fa-user-gear text-sm"></i>
      </Link>

    </nav>
  );
}
