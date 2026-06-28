import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Refer() {
  const [refCode, setRefCode] = useState("");
  const [referrals, setReferrals] = useState(0);
  const [earned, setEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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

      console.log("FULL PROFILE DATA:", res.data);

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

  const copyCode = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-3 pt-4 pb-24 font-sans">
      <div className="mx-auto max-w-[480px]">
        
        {/* Main Central White Box Wrapper */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          
          {/* Top Embedded Banner Image Grid */}
          <div className="w-full overflow-hidden rounded-xl mb-4">
            <img
              src="https://img.freepik.com/free-vector/refer-friend-concept-illustration_114360-7039.jpg"
              className="h-[200px] w-full object-cover"
              alt="Referral Banner"
              onError={(e) => {
                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50' viewBox='0 0 100 50'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='5' fill='%2394a3b8'>Ludo Referral Commission</text></svg>";
              }}
            />
          </div>

          {/* Subtitle Directive Text Description */}
          <p className="text-sm font-bold text-slate-600 text-left leading-tight">
            Share your referral link and earn <span className="font-black text-slate-800">2%</span>
          </p>

          {/* Code Input & Copy Action Wrapper Box */}
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm font-black text-slate-800 border border-slate-200 tracking-wide min-w-[95px] text-center">
              {loading ? "..." : refCode || "------"}
            </div>
            
            <button
              onClick={copyCode}
              disabled={!refCode}
              className="bg-[#10b981] active:bg-[#059669] text-white px-5 py-2 rounded-lg font-black text-sm shadow-sm transition-colors active:scale-95 disabled:bg-slate-300"
            >
              {copied ? "Copied ✔" : "Copy"}
            </button>
          </div>

          {/* Full Width WhatsApp Share Action Triggers */}
          <div className="mt-4">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#12cc66] hover:bg-[#0eb659] py-2.5 rounded-xl font-black text-white text-sm shadow-sm active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
            >
              <span className="text-base">💬</span> WhatsApp
            </a>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 text-center">
              {error}
            </p>
          )}
        </div>

        {/* --- LIFETIME EARNINGS BOARD GRID METRIC --- */}
        <div className="mt-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <h3 className="text-base font-black text-slate-800 tracking-tight">Lifetime Earnings</h3>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            
            {/* Referral Players Card */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 text-lg font-bold">
                👤
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase leading-none">Referral Players</p>
                <h2 className="text-lg font-black text-slate-800 mt-1 leading-none">{referrals}</h2>
              </div>
            </div>

            {/* Referral Earnings Card */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 text-lg font-bold">
                💵
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase leading-none">Referral Earning</p>
                <h2 className="text-lg font-black text-slate-800 mt-1 leading-none">₹{Number(earned).toFixed(0)}</h2>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
