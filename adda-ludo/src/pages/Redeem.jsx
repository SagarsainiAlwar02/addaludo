import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Redeem() {
  const token = localStorage.getItem("token");

  const MIN_AMOUNT = 200;
  const MAX_AMOUNT = 10000;

  const [amount, setAmount] = useState("");
  const [referBalance, setReferBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const loadRedeemData = async () => {
    try {
      setPageLoading(true);
      const res = await axios.get(`${API_BASE}/redeem`, authHeader);

      const balance =
        res.data.referralBalance ||
        res.data.referBalance ||
        res.data.totalReferralEarning ||
        0;

      setReferBalance(Number(balance));
    } catch (err) {
      setMessage(err.response?.data?.msg || "Redeem balance load nahi hua");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadRedeemData();
  }, []);

  const handleRedeem = async () => {
    const redeemAmount = Number(amount);

    if (!redeemAmount) return setMessage("Amount enter karo");
    if (redeemAmount < MIN_AMOUNT) return setMessage("Minimum redeem ₹200 hai");
    if (redeemAmount > MAX_AMOUNT) return setMessage("Maximum redeem ₹10000 hai");
    if (redeemAmount > referBalance) return setMessage("Insufficient refer balance");

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE}/redeem/withdraw`,
        { amount: redeemAmount, type: "refer_redeem" },
        authHeader
      );

      alert(res.data.msg || "Redeem successfully wallet me add ho gaya");
      setAmount("");
      await loadRedeemData();
    } catch (err) {
      setMessage(err.response?.data?.msg || "Redeem failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-[88px] pb-32">
      <div className="mx-auto max-w-[520px]">
        <h1 className="text-[30px] font-extrabold text-black">
          Redeem your refer balance
        </h1>

        <p className="mt-8 text-[22px] leading-9 font-medium text-black">
          Referral earning ₹200 hone ke baad redeem karke main wallet me add kar sakte ho.
        </p>

        <div className="mt-10 rounded-lg border-2 border-gray-500 bg-gray-50 p-5">
          <h2 className="text-[24px] font-bold text-gray-900">Enter Amount</h2>

          <input
            type="number"
            value={amount}
            placeholder="Enter Amount"
            onChange={(e) => {
              setAmount(e.target.value);
              setMessage("");
            }}
            className="mt-7 h-[58px] w-full rounded-lg border border-gray-300 bg-white px-4 text-[18px] outline-none shadow-sm"
          />

          <div className="mt-8 flex justify-between text-[17px] font-bold text-gray-800">
            <span>Balance: ₹{referBalance.toFixed(2)}</span>
            <span>Min: 200, Max: 10000</span>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-center font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mt-36 flex justify-center">
          <button
            onClick={handleRedeem}
            disabled={loading}
            className="rounded-lg bg-purple-500 px-14 py-4 text-[24px] font-extrabold text-white shadow-md active:scale-95 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Redeem"}
          </button>
        </div>
      </div>
    </div>
  );
}