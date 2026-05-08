import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Redeem() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const MIN_AMOUNT = 200;
  const MAX_AMOUNT = 10000;

  const [amount, setAmount] = useState("");
  const [referBalance, setReferBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  const authHeader = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const loadRedeemData = async () => {
    try {
      setPageLoading(true);
      setMessage("");

      const res = await axios.get(`${API_BASE}/redeem`, authHeader);

      const balance =
        res.data?.referralBalance ??
        res.data?.referBalance ??
        0;

      const earned =
        res.data?.totalReferralEarning ??
        res.data?.totalEarned ??
        balance;

      setReferBalance(Number(balance || 0));
      setTotalEarned(Number(earned || 0));
    } catch (err) {
      setMessage(err.response?.data?.msg || "Redeem balance load nahi hua");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loadRedeemData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRedeem = async () => {
    const redeemAmount = Number(amount);

    if (!redeemAmount) return setMessage("Amount enter karo");
    if (redeemAmount < MIN_AMOUNT) return setMessage("Minimum redeem ₹200 hai");
    if (redeemAmount > MAX_AMOUNT) return setMessage("Maximum redeem ₹10000 hai");
    if (redeemAmount > referBalance) {
      return setMessage("Insufficient referral balance");
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE}/redeem/withdraw`,
        {
          amount: redeemAmount,
          type: "refer_redeem",
        },
        authHeader
      );

      alert(res.data?.msg || "Referral earning wallet me add ho gayi");

      setAmount("");
      await loadRedeemData();

      window.dispatchEvent(new Event("walletUpdated"));
    } catch (err) {
      setMessage(err.response?.data?.msg || "Redeem failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-bold">
        Loading Redeem...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-[88px] pb-32">
      <div className="mx-auto max-w-[520px]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-xl bg-gray-100 text-2xl font-black text-black active:scale-95"
          >
            ←
          </button>

          <h1 className="text-[28px] font-extrabold text-black">
            Redeem your refer balance
          </h1>
        </div>

        <div className="mt-6 rounded-2xl bg-purple-50 p-5 border border-purple-200">
          <p className="text-lg font-bold text-gray-600">Referral Balance</p>
          <h2 className="mt-2 text-4xl font-black text-purple-700">
            ₹ {referBalance.toFixed(2)}
          </h2>

          <p className="mt-3 text-sm font-bold text-gray-500">
            Total Referral Earning: ₹ {totalEarned.toFixed(2)}
          </p>
        </div>

        <p className="mt-8 text-[20px] leading-8 font-medium text-black">
          Referral earning ₹200 hone ke baad redeem karke main wallet me add kar sakte ho.
        </p>

        <p className="mt-4 text-[16px] leading-7 font-semibold text-gray-700">
          TDS (5%) Will Be Deducted After Annual Referral Earning Of 🪙 15,000.
        </p>

        <div className="mt-8 rounded-lg border-2 border-gray-500 bg-gray-50 p-5">
          <h2 className="text-[24px] font-bold text-gray-900">Enter Amount</h2>

          <input
            type="number"
            value={amount}
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            placeholder="Enter Amount"
            onChange={(e) => {
              setAmount(e.target.value);
              setMessage("");
            }}
            className="mt-7 h-[58px] w-full rounded-lg border border-gray-300 bg-white px-4 text-[18px] font-bold outline-none shadow-sm"
          />

          <div className="mt-8 flex justify-between text-[16px] font-bold text-gray-800">
            <span>Balance: ₹{referBalance.toFixed(2)}</span>
            <span>Min: 200, Max: 10000</span>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-center font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mt-20 flex justify-center">
          <button
            onClick={handleRedeem}
            disabled={loading || referBalance < MIN_AMOUNT}
            className="rounded-lg bg-purple-500 px-14 py-4 text-[24px] font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Redeem"}
          </button>
        </div>

        {referBalance < MIN_AMOUNT && (
          <p className="mt-4 text-center text-sm font-bold text-gray-500">
            Redeem unlock hone ke liye minimum ₹200 referral balance chahiye.
          </p>
        )}
      </div>
    </div>
  );
}