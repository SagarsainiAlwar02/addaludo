import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ LIVE FIX:
// Vercel me VITE_API_URL = https://api.addaludo.com
// Agar env load na bhi ho, live fallback api.addaludo.com rahega, localhost nahi.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://api.addaludo.com");

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validatePhone = (num) => /^[6-9]\d{9}$/.test(num);

  const sendOTP = async () => {
    if (!validatePhone(phone)) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("OTP API URL:", `${API_URL}/api/send-otp`);

      const res = await axios.post(`${API_URL}/api/send-otp`, { phone });

      if (res.data?.success) {
        setStep(2);
        setTimer(30);
      } else {
        setError(res.data?.msg || "Failed to send OTP");
      }
    } catch (err) {
      console.log("OTP SEND ERROR:", err);
      setError(
        err.response?.data?.msg ||
          err.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError("Enter OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("VERIFY API URL:", `${API_URL}/api/otp-login`);

      const res = await axios.post(`${API_URL}/api/otp-login`, {
        phone,
        otp,
        referralCode: referralCode.trim().toUpperCase(),
      });

      if (!res.data?.success) {
        setError(res.data?.msg || "Invalid OTP");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (onLogin) onLogin(res.data.user);

      navigate("/");
    } catch (err) {
      console.log("OTP VERIFY ERROR:", err);
      setError(
        err.response?.data?.msg ||
          err.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#f8ecd2]">
      <div className="relative w-full max-w-[650px] min-h-screen overflow-hidden bg-gradient-to-b from-[#14061f] via-[#2a0c45] to-[#09040d] px-5 py-8">
        <div className="absolute top-[-60px] left-[-60px] h-56 w-56 rounded-full bg-yellow-400/20 blur-3xl"></div>
        <div className="absolute top-40 right-[-70px] h-72 w-72 rounded-full bg-red-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/logo.jpeg"
            alt="AddaLudo"
            className="mt-4 w-full max-w-[250px] object-contain mx-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.35)]"
          />

          <div className="mt-4 w-full rounded-2xl border border-yellow-300/40 bg-green-100/95 px-4 py-4 shadow-lg">
            <p className="text-center text-sm font-bold text-[#234100]">
              सूचना: आपका वॉलेट बैलेंस सुरक्षित है।
            </p>
          </div>

          <div className="mt-7 w-full rounded-[28px] border border-white/20 bg-white/95 p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-4xl font-black text-[#1a1036]">Login</h1>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Play Ludo • Win Cash • Instant Withdraw
              </p>
            </div>

            {step === 1 && (
              <>
                <label className="mb-2 block text-left text-sm font-bold text-gray-700">
                  Mobile Number
                </label>

                <div className="mb-4 flex items-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 focus-within:border-orange-500">
                  <span className="border-r border-gray-300 pr-3 text-lg font-bold text-gray-800">
                    +91
                  </span>

                  <input
                    type="text"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    maxLength={10}
                    className="w-full bg-transparent px-3 text-lg font-semibold outline-none"
                  />
                </div>

                <label className="mb-2 block text-left text-sm font-bold text-gray-700">
                  Referral Code Optional
                </label>

                <input
                  type="text"
                  placeholder="Enter referral code e.g. BA-438286"
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  maxLength={12}
                  className="mb-5 w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-lg font-bold uppercase outline-none focus:border-cyan-500"
                />

                <p className="mb-5 text-center text-xs leading-5 text-gray-500">
                  By continuing, you agree to our Legal Terms and confirm you
                  are 18 years or older.
                </p>

                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-4 text-lg font-black text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-center">
                  <p className="text-sm font-bold text-green-700">
                    OTP sent to +91 {phone}
                  </p>

                  {referralCode && (
                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      Referral Applied: {referralCode}
                    </p>
                  )}
                </div>

                <label className="mb-2 block text-left text-sm font-bold text-gray-700">
                  Enter OTP
                </label>

                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="mb-4 w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-center text-2xl font-black tracking-[10px] outline-none focus:border-green-500"
                />

                <button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-black text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={sendOTP}
                    disabled={timer > 0 || loading}
                    className="text-sm font-bold text-red-500 disabled:text-gray-400"
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                  </button>

                  <button
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setError("");
                    }}
                    className="text-sm font-bold text-gray-500"
                  >
                    Change Number
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-3 text-center text-sm font-bold text-red-500">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex gap-3 text-xs font-bold text-white/70">
            <span>Secure Login</span>
            <span>•</span>
            <span>Fast OTP</span>
            <span>•</span>
            <span>Real Cash Rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}