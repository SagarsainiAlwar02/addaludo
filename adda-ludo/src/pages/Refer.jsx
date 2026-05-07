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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRefCode(res.data.referralCode || "");
      setReferrals(res.data.referralStats?.referrals || 0);
      setEarned(res.data.referralStats?.earned || 0);
      setReferralBalance(res.data.referralStats?.referralBalance || 0);

      const oldUser = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...res.data,
        })
      );
    } catch (err) {
      console.log("Referral load error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Referral data load failed");
    } finally {
      setLoading(false);
    }
  };

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

  const shareText = `Join AddaLudo and use my referral code ${refCode} to play and win cash!`;

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28">
      <div className="mx-auto max-w-[650px]">
        <div className="mb-4 rounded-3xl bg-gradient-to-r from-[#101827] to-[#020617] px-5 py-5 text-white shadow-xl">
          <h2 className="text-2xl font-black">Affiliate Program</h2>
          <p className="mt-1 text-sm text-white/70">
            Refer friends and earn commission on their winning matches.
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
              Jab tumhara referred friend game jeetega, tumhe commission milega.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 text-center shadow-xl">
          <p className="font-bold text-gray-500">Your Referral Code</p>

          <div className="mt-3 flex overflow-hidden rounded-2xl bg-gray-100">
            <div className="flex-1 px-4 py-4 text-xl font-black text-cyan-500">
              {loading ? "Loading..." : refCode || "No Code"}
            </div>

            <button
              onClick={copyCode}
              disabled={!refCode}
              className="bg-cyan-500 px-6 font-black text-white disabled:bg-gray-400"
            >
              {copied ? "✔" : "Copy"}
            </button>
          </div>

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
              href={`https://t.me/share/url?url=${encodeURIComponent(refCode)}&text=${encodeURIComponent(shareText)}`}
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
            <h2 className="mt-1 text-2xl font-black">₹{earned}</h2>
          </div>

          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <h4 className="text-xs font-bold text-gray-500">Balance</h4>
            <h2 className="mt-1 text-2xl font-black text-green-600">
              ₹{referralBalance}
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">How it works?</h2>

          <div className="mt-4 space-y-3 text-sm font-semibold text-gray-600">
            <p>1. Apna referral code friend ko share karo.</p>
            <p>2. Friend login/signup time pe tumhara code dalega.</p>
            <p>3. Friend game jeetega to tumhe 2% commission milega.</p>
            <p>4. Commission referral balance me add hoga.</p>
          </div>
        </div>
      </div>
    </div>
  );
}