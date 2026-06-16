import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://api.addaludo.com/api");

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      const code = ref.trim().toUpperCase();
      setReferralCode(code);
      localStorage.setItem("pendingReferralCode", code);
    }
  }, []);

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
      setOtp("");
      setVerificationId("");

      const res = await axios.post(`${API_URL}/otp/send`, {
        countryCode: "91",
        mobileNumber: phone,
        messageText: "Your verification code is ##var1##",
      });

      if (res.data?.success && res.data?.verificationId) {
        setVerificationId(res.data.verificationId);
        setStep(2);
        setTimer(30);
      } else {
        setError(res.data?.error || res.data?.msg || "Failed to send OTP");
      }
    } catch (err) {
      console.log("OTP SEND ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.msg || err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError("Enter OTP");
      return;
    }

    if (!verificationId) {
      setError("Verification ID missing. Please send OTP again");
      return;
    }

    const finalReferralCode =
      referralCode.trim().toUpperCase() ||
      localStorage.getItem("pendingReferralCode") ||
      "";

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API_URL}/otp/verify`, {
        verificationId,
        code: otp,
        mobileNumber: phone,
        referralCode: finalReferralCode,
      });

      if (!res.data?.success) {
        setError(res.data?.error || res.data?.msg || "Invalid OTP");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.removeItem("pendingReferralCode");

      if (onLogin) onLogin(res.data.user);

      navigate("/");
    } catch (err) {
      console.log("OTP VERIFY ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.msg || err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#f8ecd2]">
      <div className="relative w-full max-w-[650px] min-h-screen overflow-hidden bg-gradient-to-b from-[#14061f] via-[#2a0c45] to-[#09040d] px-5 py-8">
        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="AddaLudo"
            className="mt-4 w-full max-w-[250px] object-contain mx-auto"
          />

          <div className="mt-7 w-full rounded-[28px] border border-white/20 bg-white/95 p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-4xl font-black text-[#1a1036]">Login</h1>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Play Ludo • Win Cash • Instant Withdraw
              </p>
            </div>

            {step === 1 && (
              <>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Mobile Number
                </label>

                <div className="mb-4 flex items-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-4">
                  <span className="border-r border-gray-300 pr-3 text-lg font-bold">
                    +91
                  </span>

                  <input
                    type="text"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    className="w-full bg-transparent px-3 text-lg font-semibold outline-none"
                    autoComplete="tel"
                  />
                </div>

                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Referral Code Optional
                </label>

                <input
                  type="text"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setReferralCode(code);
                    localStorage.setItem("pendingReferralCode", code);
                  }}
                  maxLength={20}
                  className="mb-5 w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-lg font-bold uppercase outline-none"
                />

                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-4 text-lg font-black text-white shadow-lg disabled:opacity-60"
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

                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="mb-4 w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-center text-2xl font-black tracking-[10px] outline-none"
                  autoComplete="one-time-code"
                />

                <button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-black text-white shadow-lg disabled:opacity-60"
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
        </div>
      </div>
    </div>
  );
}