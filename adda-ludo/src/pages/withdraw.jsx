import React, { useState, useEffect } from "react";
import axios from "axios";

const WithdrawPage = ({ onBack }) => {
  const [method, setMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [details, setDetails] = useState({
    upi: "",
    acc: "",
    ifsc: "",
    name: "",
    qr: null,
  });

  const token = localStorage.getItem("token");

  const MIN_WITHDRAW = 300;
  const COOLDOWN_TIME = 3 * 60 * 60 * 1000;

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadWallet = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/wallet", authHeader);
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.log("Wallet load error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    const checkTimer = () => {
      const lastTime = localStorage.getItem("last_withdraw_time");
      if (!lastTime) return;

      const diff = Date.now() - Number(lastTime);

      if (diff < COOLDOWN_TIME) {
        setTimeLeft(Math.ceil((COOLDOWN_TIME - diff) / 1000));
      } else {
        setTimeLeft(0);
        localStorage.removeItem("last_withdraw_time");
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h}h ${m}m ${s}s`;
  };

  const handleRequest = async () => {
    const val = Number(amount);

    if (timeLeft > 0) {
      alert(`Please wait ${formatTime(timeLeft)} for your next withdrawal.`);
      return;
    }

    if (!val || val < MIN_WITHDRAW) {
      alert(`Minimum withdrawal amount is ₹${MIN_WITHDRAW}`);
      return;
    }

    if (val > balance) {
      alert("Insufficient balance in your wallet!");
      return;
    }

    if (method === "upi" && !details.upi.includes("@")) {
      alert("Please enter valid UPI ID");
      return;
    }

    if (
      method === "bank" &&
      (!details.name || !details.acc || !details.ifsc)
    ) {
      alert("Please fill all bank details");
      return;
    }

    if (method === "scanner" && !details.qr) {
      alert("Please upload payment QR code");
      return;
    }

    const confirmWithdraw = window.confirm(
      `Withdraw ₹${val} using ${method.toUpperCase()}?`
    );

    if (!confirmWithdraw) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("amount", val);
      formData.append("method", method);
      formData.append("upi", details.upi);
      formData.append("accountNumber", details.acc);
      formData.append("ifsc", details.ifsc);
      formData.append("accountName", details.name);

      if (details.qr) {
        formData.append("qr", details.qr);
      }

      const res = await axios.post(
        "http://localhost:5000/api/wallet/withdraw",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      localStorage.setItem("last_withdraw_time", Date.now().toString());

      alert(res.data.msg || "Withdrawal request submitted successfully");

      setAmount("");
      setDetails({
        upi: "",
        acc: "",
        ifsc: "",
        name: "",
        qr: null,
      });

      await loadWallet();

      if (onBack) onBack();
    } catch (err) {
      alert(err.response?.data?.msg || "Withdrawal request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white p-6 font-sans max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-yellow-400 text-xl">
          ←
        </button>

        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          Withdraw
        </h2>
      </div>

      <div className="bg-[#161d2e] p-6 rounded-[2rem] border border-slate-800 mb-6 text-center shadow-2xl">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          Available Balance
        </p>

        <h3 className="text-3xl font-black text-yellow-400 mb-3">
          ₹{balance}
        </h3>

        {timeLeft > 0 ? (
          <div className="bg-red-500/10 text-red-500 text-[10px] font-black p-3 rounded-2xl border border-red-500/20 italic">
            🕒 NEXT WITHDRAWAL IN: {formatTime(timeLeft)}
          </div>
        ) : (
          <div className="bg-green-500/10 text-green-500 text-[10px] font-black p-3 rounded-2xl border border-green-500/20 uppercase tracking-widest">
            ✅ Ready to Withdraw
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 bg-[#161d2e] p-1.5 rounded-2xl border border-slate-800">
        {["upi", "bank", "scanner"].map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${
              method === m
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-500"
            }`}
          >
            {m === "scanner" ? "QR Image" : m}
          </button>
        ))}
      </div>

      <div className="bg-[#161d2e] p-5 rounded-[2rem] border border-slate-800 mb-6">
        <label className="text-[10px] font-black text-gray-500 uppercase">
          Withdraw Amount
        </label>

        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          className="w-full mt-2 mb-4 p-4 rounded-2xl bg-[#0b0f1a] border border-slate-700 text-white outline-none"
        />

        <p className="text-[11px] text-gray-500 mb-4">
          Minimum withdraw: ₹{MIN_WITHDRAW}
        </p>

        {method === "upi" && (
          <>
            <label className="text-[10px] font-black text-gray-500 uppercase">
              UPI ID
            </label>

            <input
              type="text"
              placeholder="example@upi"
              value={details.upi}
              onChange={(e) =>
                setDetails({ ...details, upi: e.target.value })
              }
              disabled={loading}
              className="w-full mt-2 p-4 rounded-2xl bg-[#0b0f1a] border border-slate-700 text-white outline-none"
            />
          </>
        )}

        {method === "bank" && (
          <>
            <label className="text-[10px] font-black text-gray-500 uppercase">
              Account Holder Name
            </label>

            <input
              type="text"
              placeholder="Account holder name"
              value={details.name}
              onChange={(e) =>
                setDetails({ ...details, name: e.target.value })
              }
              disabled={loading}
              className="w-full mt-2 mb-3 p-4 rounded-2xl bg-[#0b0f1a] border border-slate-700 text-white outline-none"
            />

            <label className="text-[10px] font-black text-gray-500 uppercase">
              Account Number
            </label>

            <input
              type="text"
              placeholder="Account number"
              value={details.acc}
              onChange={(e) =>
                setDetails({ ...details, acc: e.target.value })
              }
              disabled={loading}
              className="w-full mt-2 mb-3 p-4 rounded-2xl bg-[#0b0f1a] border border-slate-700 text-white outline-none"
            />

            <label className="text-[10px] font-black text-gray-500 uppercase">
              IFSC Code
            </label>

            <input
              type="text"
              placeholder="IFSC code"
              value={details.ifsc}
              onChange={(e) =>
                setDetails({
                  ...details,
                  ifsc: e.target.value.toUpperCase(),
                })
              }
              disabled={loading}
              className="w-full mt-2 p-4 rounded-2xl bg-[#0b0f1a] border border-slate-700 text-white outline-none"
            />
          </>
        )}

        {method === "scanner" && (
          <>
            <label className="text-[10px] font-black text-gray-500 uppercase">
              Upload QR Code
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setDetails({ ...details, qr: e.target.files[0] })
              }
              disabled={loading}
              className="w-full mt-2 p-4 rounded-2xl bg-[#0b0f1a] border border-slate-700 text-white outline-none"
            />

            {details.qr && (
              <p className="text-green-400 text-xs mt-3">
                Selected: {details.qr.name}
              </p>
            )}
          </>
        )}
      </div>

      <button
        onClick={handleRequest}
        disabled={loading || timeLeft > 0}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest ${
          loading || timeLeft > 0
            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
            : "bg-yellow-400 text-black"
        }`}
      >
        {loading ? "Submitting..." : "Submit Withdraw Request"}
      </button>
    </div>
  );
};

export default WithdrawPage;