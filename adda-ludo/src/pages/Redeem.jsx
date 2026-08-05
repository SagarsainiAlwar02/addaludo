import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";

export default function Redeem() {
  const navigate = useNavigate();

  const MIN_AMOUNT = 200;
  const MAX_AMOUNT = 10000;

  const [amount, setAmount] = useState("");
  const [referBalance, setReferBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRedeemData = async () => {
    try {
      setPageLoading(true);
      setMessage("");

      const res = await api.get("/user/referrals");
      const data = getData(res);

      setReferBalance(Number(data?.referralBalance || 0));
      setTotalEarned(Number(data?.totalReferralEarning || 0));
    } catch (err) {
      setMessage(getError(err));
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    loadRedeemData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedeem = async () => {
    const redeemAmount = Number(amount);

    if (!redeemAmount) return setMessage("Enter Amount");
    if (redeemAmount < MIN_AMOUNT) return setMessage("Minimum redeem ₹200 hai");
    if (redeemAmount > MAX_AMOUNT) return setMessage("Maximum redeem ₹10000 hai");
    if (redeemAmount > referBalance) {
      return setMessage("Insufficient referral balance");
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/transactions/redeem-referral", {
        amount: redeemAmount,
      });

      alert("Referral earning wallet me add ho gayi");

      setAmount("");
      await loadRedeemData();

      window.dispatchEvent(new Event("walletUpdated"));
    } catch (err) {
      setMessage(getError(err));
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

          <div className="mt-4 flex justify-between text-[14px] font-bold text-gray-700">
            <span>Balance: ₹{referBalance.toFixed(2)}</span>
            <span>Min: 200, Max: 10000</span>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-center font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleRedeem}
            disabled={loading || referBalance < MIN_AMOUNT}
            className="rounded-lg bg-purple-500 px-10 py-2.5 text-[18px] font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
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
