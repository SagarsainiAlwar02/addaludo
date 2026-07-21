import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Withdraw() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const MIN_WITHDRAW = 200;

  const [amount, setAmount] = useState("");
  const [winningBalance, setWinningBalance] = useState(0);
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [details, setDetails] = useState({
    upiId: "",
    confirmUpiId: "",
    holderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: "",
  });

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const loadData = async () => {
    try {
      setPageLoading(true);
      const res = await axios.get(`${API_BASE}/redeem`, authHeader);
      setWinningBalance(Number(res.data.winningBalance || 0));
    } catch (err) {
      setMessage(err.response?.data?.msg || "Withdraw data load nahi hua");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bankRequired = Number(amount) > 2000;

  const submitWithdraw = async () => {
    const withdrawAmount = Number(amount);

    // ✅ KYC CHECK START
    try {
      const profileRes = await axios.get(`${API_BASE}/user/profile`, authHeader);

      const kycStatus = profileRes.data?.kycStatus || "not_submitted";

      if (kycStatus !== "approved") {
        alert("Withdraw ke liye KYC complete karna jaruri hai.");
        navigate("/kyc");
        return;
      }
    } catch (err) {
      alert("KYC status check nahi hua. Please login again.");
      return;
    }
    // ✅ KYC CHECK END

    if (!withdrawAmount) return setMessage("Amount enter karo");

    if (withdrawAmount < MIN_WITHDRAW) {
      return setMessage("Minimum withdraw ₹200 hai");
    }

    if (withdrawAmount > winningBalance) {
      return setMessage("Insufficient winning balance");
    }

    let finalMethod = bankRequired ? "bank" : method;
    let withdrawDetails = {};

    if (finalMethod === "upi") {
      if (!details.upiId || !details.confirmUpiId) {
        return setMessage("UPI ID fill karo");
      }

      if (details.upiId !== details.confirmUpiId) {
        return setMessage("UPI ID match nahi hui");
      }

      withdrawDetails = { upiId: details.upiId };
    }

    if (finalMethod === "bank") {
      if (
        !details.holderName ||
        !details.accountNumber ||
        !details.confirmAccountNumber ||
        !details.ifsc
      ) {
        return setMessage("Bank details complete fill karo");
      }

      if (details.accountNumber !== details.confirmAccountNumber) {
        return setMessage("Account number match nahi hua");
      }

      withdrawDetails = {
        holderName: details.holderName,
        accountNumber: details.accountNumber,
        ifsc: details.ifsc,
      };
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE}/redeem/withdraw`,
        {
          amount: withdrawAmount,
          method: finalMethod,
          details: withdrawDetails,
        },
        authHeader
      );

      alert(res.data.msg || "Withdraw request submitted successfully");

      setAmount("");
      setMethod("upi");
      setDetails({
        upiId: "",
        confirmUpiId: "",
        holderName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifsc: "",
      });

      await loadData();
    } catch (err) {
      if (err.response?.data?.kycRequired) {
        alert(err.response?.data?.msg || "Withdraw ke liye KYC jaruri hai.");
        navigate("/kyc");
        return;
      }

      setMessage(err.response?.data?.msg || "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-bold">
        Loading Withdraw...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-3 pt-[76px] pb-28">
      <div className="mx-auto max-w-[460px]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-gray-100 text-xl font-black"
          >
            ←
          </button>

          <h1 className="text-[24px] font-extrabold text-black">
            Withdraw Winning
          </h1>
        </div>

        <div className="mt-4 rounded-2xl bg-green-50 p-4 border border-green-200">
          <p className="text-sm font-bold text-gray-600">
            Available Winning Coin
          </p>
          <h2 className="mt-1 text-3xl font-black text-green-700">
            ₹ {winningBalance.toFixed(2)}
          </h2>
        </div>

        <div className="mt-4 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3">
          <p className="text-[13px] leading-5 font-bold text-yellow-900">
            NOTE :- कृपया UPI और ACCOUNT details सही से भरे , गलत details भरने
            पर हमारी जिम्मेदारी नहीं होगी !
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-300 bg-gray-50 p-4">
          <label className="text-base font-bold text-gray-900">
            Enter Withdraw Amount
          </label>

          <input
            type="number"
            value={amount}
            placeholder="Enter Amount"
            onChange={(e) => {
              const val = e.target.value;
              setAmount(val);
              setMessage("");

              if (Number(val) > 2000) {
                setMethod("bank");
              }
            }}
            className="mt-3 h-[50px] w-full rounded-xl border border-gray-300 bg-white px-4 text-base font-bold outline-none"
          />

          <p className="mt-2 text-xs font-bold text-gray-600">
            Min: ₹200 | ₹2000 se upar Bank Transfer required
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => !bankRequired && setMethod("upi")}
            disabled={bankRequired}
            className={`rounded-xl py-3 text-sm font-black ${
              method === "upi"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            } disabled:opacity-40`}
          >
            UPI
          </button>

          <button
            onClick={() => setMethod("bank")}
            className={`rounded-xl py-3 text-sm font-black ${
              method === "bank"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Bank
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-md border border-gray-100">
          {method === "upi" && !bankRequired && (
            <>
              <h2 className="text-lg font-black">UPI Details</h2>

              <input
                value={details.upiId}
                placeholder="Enter UPI ID"
                onChange={(e) =>
                  setDetails({ ...details, upiId: e.target.value })
                }
                className="mt-3 h-[48px] w-full rounded-xl border px-4 text-sm font-bold outline-none"
              />

              <input
                value={details.confirmUpiId}
                placeholder="Confirm UPI ID"
                onChange={(e) =>
                  setDetails({ ...details, confirmUpiId: e.target.value })
                }
                className="mt-3 h-[48px] w-full rounded-xl border px-4 text-sm font-bold outline-none"
              />
            </>
          )}

          {(method === "bank" || bankRequired) && (
            <>
              <h2 className="text-lg font-black">Bank Details</h2>

              <input
                value={details.holderName}
                placeholder="Account Holder Name"
                onChange={(e) =>
                  setDetails({ ...details, holderName: e.target.value })
                }
                className="mt-3 h-[48px] w-full rounded-xl border px-4 text-sm font-bold outline-none"
              />

              <input
                value={details.accountNumber}
                placeholder="Account Number"
                onChange={(e) =>
                  setDetails({ ...details, accountNumber: e.target.value })
                }
                className="mt-3 h-[48px] w-full rounded-xl border px-4 text-sm font-bold outline-none"
              />

              <input
                value={details.confirmAccountNumber}
                placeholder="Confirm Account Number"
                onChange={(e) =>
                  setDetails({
                    ...details,
                    confirmAccountNumber: e.target.value,
                  })
                }
                className="mt-3 h-[48px] w-full rounded-xl border px-4 text-sm font-bold outline-none"
              />

              <input
                value={details.ifsc}
                placeholder="IFSC Code"
                onChange={(e) =>
                  setDetails({
                    ...details,
                    ifsc: e.target.value.toUpperCase(),
                  })
                }
                className="mt-3 h-[48px] w-full rounded-xl border px-4 text-sm font-bold outline-none"
              />
            </>
          )}
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-center text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <button
          onClick={submitWithdraw}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-green-600 py-3.5 text-base font-black text-white shadow-lg disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Withdraw Request"}
        </button>
      </div>
    </div>
  );
} 
