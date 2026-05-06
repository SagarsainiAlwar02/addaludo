import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HeaderMain() {

  const navigate = useNavigate();

  const [balance, setBalance] = useState("0.00");

  useEffect(() => {

    const fetchWallet = async () => {

      try {

        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/wallet",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("HEADER WALLET:", res.data);

        // ✅ TOTAL BALANCE
        const total =
          (res.data.balance || 0) +
          (res.data.winnings || 0) +
          (res.data.bonus || 0);

        setBalance(total.toFixed(2));

      } catch (err) {

        console.log("HEADER ERROR:", err.message);

      }
    };

    fetchWallet();

  }, []);

  return (
    <header className="w-full bg-gradient-to-r from-black via-[#050816] to-black shadow-2xl border-b border-slate-800">

      <div className="mx-auto flex h-[82px] max-w-[1280px] items-center justify-between px-4">

        {/* ================= LOGO ================= */}
        <div
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center"
        >
          <img
            src="/logo.jpeg"
            alt="AddaLudo"
            className="h-[70px] w-[160px] object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.35)]"
          />
        </div>

        {/* ================= DOWNLOAD BUTTON ================= */}
        <button className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 text-[18px] font-extrabold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-green-400 hover:to-emerald-500">
          Download App
        </button>

        {/* ================= RIGHT SECTION ================= */}
        <div className="flex items-center gap-3">

          {/* Wallet */}
          <div
            onClick={() => navigate("/wallet")}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-5 py-3 shadow-md transition hover:bg-slate-700"
          >
            <i className="fa-solid fa-wallet text-lg text-green-400"></i>

            <span className="text-[18px] font-extrabold text-white">
              ₹ {balance}
            </span>
          </div>

          {/* Menu */}
          <div
            onClick={() => navigate("/redeem")}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-5 py-3 shadow-md transition hover:bg-slate-700"
          >
            <i className="fa-solid fa-list text-lg text-cyan-400"></i>

            <span className="text-[18px] font-extrabold text-white">
              0
            </span>
          </div>

        </div>

      </div>

    </header>
  );
}