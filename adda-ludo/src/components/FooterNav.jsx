import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function FooterNav() {
  const location = useLocation();
  const path = location.pathname;

  // Tab items configuration for dynamic rendering
  const navItems = [
    {
      to: "/support",
      label: "Support",
      iconClass: "fa-regular fa-comment-dots",
    },
    {
      to: "/refer",
      label: "Refer",
      iconClass: "fa-solid fa-gift",
    },
    {
      to: "/",
      label: "Home",
      iconClass: "fa-solid fa-house",
    },
    {
      to: "/wallet",
      label: "Wallet",
      iconClass: "fa-solid fa-wallet",
    },
    {
      to: "/profile",
      label: "Profile",
      iconClass: "fa-solid fa-user",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-center justify-around bg-slate-900 px-3 py-2 border-t border-slate-800 shadow-2xl">
      {navItems.map((item) => {
        const isActive = path === item.to;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300 ease-in-out ${
              isActive
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {/* Icon */}
            <i className={`${item.iconClass} text-sm transition-transform duration-300 ${isActive ? "scale-110" : ""}`}></i>

            {/* Dynamic Label Container with Smooth Width Expansion */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 w-0"
              }`}
            >
              <span className="overflow-hidden text-xs font-bold whitespace-nowrap tracking-wide">
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
