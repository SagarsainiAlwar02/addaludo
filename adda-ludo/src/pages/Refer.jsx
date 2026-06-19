import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Refer() {
  const [refCode, setRefCode] = useState("");
  const [referrals, setReferrals] = useState(0);
  const [earned, setEarned] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
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

  

// ✅ YAHAN ADD KARO
console.log("FULL PROFILE DATA:", res.data);
console.log("REFERRAL STATS:", res.data.referralStats);

      setRefCode(res.data.referralCode || "");
      setReferrals(res.data.referralStats?.referrals || 0);
      setEarned(res.data.referralStats?.earned || 0);
      setReferralBalance(res.data.referralStats?.referralBalance || 0);

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
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28">
      <div className="mx-auto max-w-[650px]">
        <div className="mb-4 rounded-3xl bg-gradient-to-r from-[#101827] to-[#020617] px-5 py-5 text-white shadow-xl">
          <h2 className="text-2xl font-black">Affiliate Program</h2>
          <p className="mt-1 text-sm text-white/70">
            Refer friends and earn 2% commission when they win a game.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <img
            src="https://img.freepik.com/free-vector/refer-friend-concept-illustration_114360-7039.jpg"
            className="h-[220px] w-full object-cover"
            alt="Referral Banner"
          />

          <div className="bg-gradient-to-b from-slate-800 to-black p-6 text-center text-white">
            <h3 className="text-3xl font-black text-green-400">
              GET 2% COMMISSION
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Tumhara referred friend game jeetega to tumhe winning amount ka 2% milega.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 text-center shadow-xl">
          <p className="font-bold text-gray-500">Your Referral Link</p>

          <div className="mt-3 overflow-hidden rounded-2xl bg-gray-100">
            <div className="break-all px-4 py-4 text-sm font-black text-cyan-600">
              {loading ? "Loading..." : referralLink || "No Referral Link"}
            </div>

            <button
              onClick={copyCode}
              disabled={!referralLink}
              className="w-full bg-cyan-500 px-6 py-3 font-black text-white disabled:bg-gray-400"
            >
              {copied ? "Copied ✔" : "Copy Link"}
            </button>
          </div>

          <p className="mt-3 text-sm font-bold text-gray-600">
            Code: {loading ? "Loading..." : refCode || "No Code"}
          </p>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={fetchReferralData}
            className="mt-3 rounded-xl bg-black px-5 py-2 text-sm font-black text-white"
          >
            Refresh
          </button>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#25D366] py-3 text-center font-black text-white"
            >
              WhatsApp
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                referralLink
              )}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#0088cc] py-3 text-center font-black text-white"
            >
              Telegram
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <h4 className="text-xs font-bold text-gray-500">Referrals</h4>
            <h2 className="mt-1 text-2xl font-black">{referrals}</h2>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <h4 className="text-xs font-bold text-gray-500">Earned</h4>
            <h2 className="mt-1 text-2xl font-black">₹{Number(earned).toFixed(2)}</h2>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <h4 className="text-xs font-bold text-gray-500">Balance</h4>
            <h2 className="mt-1 text-2xl font-black text-green-600">
              ₹{Number(referralBalance).toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">How it works?</h2>

          <div className="mt-4 space-y-3 text-sm font-semibold text-gray-600">
            <p>1. Apna referral link friend ko share karo.</p>
            <p>2. Friend link se login karega to tumhare under add hoga.</p>
            <p>3. Friend game jeetega to tumhe winning amount ka 2% commission milega.</p>
            <p>4. Referral balance ₹200 hone par redeem karke wallet me add karo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}