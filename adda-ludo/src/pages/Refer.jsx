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
                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50' viewBox='0 0 100 50'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x
