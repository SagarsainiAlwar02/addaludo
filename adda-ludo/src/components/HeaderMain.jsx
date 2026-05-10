import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HeaderMain() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setBalance("0.00");
          return;
        }

        const res = await axios.get(`${API_BASE}/wallet`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ✅ FIX: bonus ko dobara add nahi karna
        // wallet.balance me admin bonus already add ho chuka hota hai
        const total =
          Number(res.data.balance || 0) +
          Number(res.data.winnings || 0);

        setBalance(total.toFixed(2));
      } catch (err) {
        console.log("HEADER WALLET ERROR:", err.response?.data || err.message);
        setBalance("0.00");
      }
    };

    fetchWallet();

    const refreshWallet = () => fetchWallet();
    window.addEventListener("walletUpdated", refreshWallet);

    return () => {
      window.removeEventListener("walletUpdated", refreshWallet);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-gradient-to-r from-black via-[#050816] to-black shadow-lg border-b border-slate-800">
      <div className="mx-auto flex h-[58px] w-full max-w-[760px] items-center justify-between px-3 sm:h-[70px] sm:px-4">
        <div
          onClick={() => navigate("/")}
          className="flex shrink-0 cursor-pointer items-center"
        >
          <img
            src="/logo.png"
            alt="AddaLudo"
            className="h-[44px] w-[82px] object-contain sm:h-[58px] sm:w-[120px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-3 py-2 shadow-md active:scale-95 sm:gap-2 sm:px-4"
          >
            <i className="fa-solid fa-wallet text-sm text-green-400 sm:text-base"></i>
            <span className="text-sm font-extrabold text-white sm:text-base">
              ₹ {balance}
            </span>
          </button>

          <button
            onClick={() => navigate("/redeem")}
            className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-3 py-2 shadow-md active:scale-95 sm:gap-2 sm:px-4"
          >
            <i className="fa-solid fa-list text-sm text-cyan-400 sm:text-base"></i>
            <span className="text-sm font-extrabold text-white sm:text-base">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}