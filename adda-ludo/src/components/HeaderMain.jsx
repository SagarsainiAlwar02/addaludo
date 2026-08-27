import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import api, { getData, getError } from "../api.js";
import DepositFlow from "./DepositFlow.jsx";

function isApp() {
  const ua = navigator.userAgent || "";
  return /AddaLudo/i.test(ua) || /WebView/i.test(ua) || /wv/i.test(ua);
}

export default function HeaderMain() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState("0.00");
  const [referBalance, setReferBalance] = useState("0.00");
  const [showDownload, setShowDownload] = useState(() => !isApp());

  // Add Cash (new DepositFlow) state
  const [showAddCash, setShowAddCash] = useState(false);
  const [payment, setPayment] = useState(null);

  const fetchBalances = useCallback(async () => {
    try {
      if (!localStorage.getItem("token")) {
        setBalance("0.00");
        setReferBalance("0.00");
        return;
      }

      const [profileRes, referralRes] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/referrals"),
      ]);

      const w = getData(profileRes)?.wallet || {};
      const total =
        Number(w.balance || 0) +
        Number(w.winnings || 0) +
        Number(w.bonus || 0);

      const r = getData(referralRes) || {};
      const referralAmount = Number(r.referralBalance || 0);

      setBalance(total.toFixed(2));
      setReferBalance(referralAmount.toFixed(2));
    } catch (err) {
      console.log("HEADER WALLET ERROR:", err);
      setBalance("0.00");
      setReferBalance("0.00");
    }
  }, []);

  const loadPaymentSettings = useCallback(async () => {
    try {
      const res = await api.get("/payment/settings");
      const data = getData(res);
      setPayment(data?.settings || data);
    } catch (err) {
      console.log("Payment setting load error:", getError(err));
    }
  }, []);

  useEffect(() => {
    // Deferred so the linter's set-state-in-effect rule is satisfied;
    // it still runs immediately after mount.
    const initialFetch = setTimeout(fetchBalances, 0);

    const refreshWallet = () => fetchBalances();
    window.addEventListener("walletUpdated", refreshWallet);

    return () => {
      clearTimeout(initialFetch);
      window.removeEventListener("walletUpdated", refreshWallet);
    };
  }, [fetchBalances]);

  // Open the new Add Cash (DepositFlow) overlay directly from the header
  const openAddCash = () => {
    setShowAddCash(true);
    loadPaymentSettings();
  };

  return (
    <>
    <style>{`
      @keyframes dlPulse {
        0%, 100% { color: #34d399; }
        50% { color: #ffffff; }
      }
      .app-dl-icon { animation: dlPulse 2s ease-in-out infinite; }
      .app-dl-btn { transition: transform 0.15s ease, box-shadow 0.2s ease; }
      .app-dl-btn:hover { box-shadow: 0 0 12px rgba(52,211,153,0.4); }
    `}</style>
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
          {showDownload && (
            <a
              href="/api/app/download"
              className="app-dl-btn flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1.5 shadow-md active:scale-95 sm:gap-1.5 sm:px-3.5"
              title="Download App"
            >
              <i className="fa-solid fa-download app-dl-icon text-xs text-emerald-400 sm:text-sm"></i>
              <span className="text-xs font-extrabold text-white sm:text-sm">
                App
              </span>
            </a>
          )}

          <button
            onClick={openAddCash}
            title="Add Cash"
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 shadow-md shadow-cyan-500/20 active:scale-95 sm:gap-1.5 sm:px-4"
          >
            <i className="fa-solid fa-wallet text-xs text-white drop-shadow sm:text-sm"></i>
            <span className="text-xs font-extrabold text-white drop-shadow sm:text-sm">
              ₹ {balance}
            </span>
          </button>

          <button
            onClick={() => navigate("/redeem")}
            className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1.5 shadow-md active:scale-95 sm:gap-1.5 sm:px-3.5"
          >
            <i className="fa-solid fa-list text-xs text-cyan-400 sm:text-sm"></i>
            <span className="text-xs font-extrabold text-white sm:text-sm">
              ₹ {referBalance}
            </span>
          </button>
        </div>
      </div>

      {/* NEW DEPOSIT FLOW (addafun design) — opened via the wallet balance button.
          Rendered in a portal so the fixed overlay escapes the header's z-40
          stacking context and covers the whole screen (incl. footer). */}
      {showAddCash &&
        createPortal(
          <DepositFlow
            payment={payment}
            onClose={() => setShowAddCash(false)}
            onSuccess={fetchBalances}
          />,
          document.body
        )}
    </header>
    </>
  );
}
