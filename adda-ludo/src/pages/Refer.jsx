import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Refer() {
  const [refCode, setRefCode] = useState("");
  const [referrals, setReferrals] = useState(0);
  const [earned, setEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again");
        return;
      }

      const res = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRefCode(res.data.referralCode || "");
      setReferrals(res.data.referralStats?.referrals || 0);
      setEarned(res.data.referralStats?.earned || 0);

      const oldUser = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem("user", JSON.stringify({ ...oldUser, ...res.data }));
    } catch (err) {
      console.log("Referral load error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Referral data load failed");
    } finally {
      setLoading(false);
    }
  };

  const referralLink = refCode
    ? `${window.location.origin}/login?ref=${encodeURIComponent(refCode)}`
    : "";

  const shareText = `Join AddaLudo and play Ludo cash games. Use my referral link: ${referralLink}`;

  const copyOnlyCode = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      alert("Copy failed");
    }
  };

  const copyFullLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-3 pt-16 pb-24 font-sans">
      <div className="mx-auto max-w-[480px]">
        
        {/* Main Central White Box Wrapper */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          
          {/* Top Custom Embedded SVG Graphics (Fixed & Checked) */}
          <div className="w-full overflow-hidden flex justify-center items-center py-4 bg-amber-50/40 rounded-xl mb-4">
            <svg width="160" height="160" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-[160px]">
              <path d="M20 12V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 8C22 7.44772 21.5523 7 21 7H3C2.44772 7 2 7.44772 2 8V11C2 11.5523 2.44772 12 3 12H21C21.5523 12 22 11.5523 22 11V8Z" fill="#ffb020" stroke="#f59e0b" strokeWidth="2"/>
              <path d="M12 7V21" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 7C12 4 10 2 8.5 2C7 2 6 3 6 4.5C6 7 10 7 12 7Z" fill="#fee2e2" stroke="#ef4444" strokeWidth="2"/>
              <path d="M12 7C12 4 14 2 15.5 2C17 2 18 3 18 4.5C18 7 14 7 12 7Z" fill="#fee2e2" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="12" cy="12" r="2" fill="#ef4444"/>
            </svg>
          </div>

          {/* Subtitle Directive Text Description */}
          <p className="text-sm font-bold text-slate-600 text-left leading-tight">
            Share your referral link and earn <span className="font-black text-slate-800">2%</span>
          </p>

          {/* 1. Code Row Panel */}
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm font-black text-slate-800 border border-slate-200 tracking-wide min-w-[95px] text-center">
              {loading ? "..." : refCode || "------"}
            </div>
            
            <button
              onClick={copyOnlyCode}
              disabled={!refCode}
              className="bg-[#10b981] active:bg-[#059669] text-white px-5 py-2 rounded-lg font-black text-sm shadow-sm transition-all active:scale-95 disabled:bg-slate-300"
            >
              {copiedCode ? "Copied ✔" : "Copy Code"}
            </button>
          </div>

          {/* 2. Full Link Display & Copy Option Row Panel */}
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs font-bold text-cyan-600 border border-slate-200 flex-1 truncate text-left select-all">
              {loading ? "Loading..." : referralLink || "No Referral Link"}
            </div>
            
            <button
              onClick={copyFullLink}
              disabled={!referralLink}
              className="bg-[#2563eb] active:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg font-black text-xs shadow-sm transition-all active:scale-95 disabled:bg-slate-300 whitespace-nowrap"
            >
              {copiedLink ? "Copied ✔" : "Copy Link"}
            </button>
          </div>

          {/* Full Width WhatsApp Share Action Trigger */}
          <div className="mt-4">
            <a
