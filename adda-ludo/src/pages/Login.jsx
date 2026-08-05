import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { getError } from "../api.js";

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationId, setVerificationId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(0);

  const otpRef = useRef([]);
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
      setSuccessMessage("");
      setOtp(["", "", "", "", "", ""]);
      setVerificationId("");

      const res = await api.post("/auth/otp/send", { phone });

      const vId = res.data?.data?.verificationId || `v_id_${phone}`;
      setVerificationId(vId);
      setShowOtp(true);
      setTimer(30);
      setSuccessMessage("OTP sent successfully");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }

    const finalReferralCode =
      referralCode.trim().toUpperCase() ||
      localStorage.getItem("pendingReferralCode") ||
      "";

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/otp/verify", {
        otp: otpCode,
        phone,
        referralCode: finalReferralCode,
      });

      const data = res.data?.data || res.data;
      const token = data?.token;
      const user = data?.user;

      if (!token) {
        setError(
          "Login successful, but authorization token was missing from backend response."
        );
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || { phone }));
      localStorage.removeItem("pendingReferralCode");

      if (onLogin) onLogin(user || { phone });

      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const temp = [...otp];
    temp[index] = value.slice(-1);
    setOtp(temp);

    if (value && index < 5) {
      otpRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRef.current[index - 1]?.focus();
    }
  };

  const handleChangeNumber = () => {
    setShowOtp(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccessMessage("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {!showOtp ? (
          <>
            <img src="/logo.png" alt="AddaLudo" style={styles.logoImage} />

            <h2 style={styles.title}>Welcome Back</h2>

            <p style={styles.subtitle}>Login using your mobile number</p>

            <div style={styles.mobileBox}>
              <div style={styles.country}>+91</div>

              <input
                style={styles.input}
                type="tel"
                placeholder="Enter Mobile Number"
                value={phone}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) setPhone(value);
                }}
                autoComplete="tel"
              />
            </div>

            <div style={styles.referBox}>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter Refer Code (Optional)"
                value={referralCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setReferralCode(code);
                  localStorage.setItem("pendingReferralCode", code);
                }}
              />
            </div>

            <button style={styles.button} onClick={sendOTP} disabled={loading}>
              {loading ? "Sending..." : "Continue"}
            </button>

            <p style={styles.note}>
              By continuing you agree to our Terms &amp; Conditions and Privacy
              Policy.
            </p>
          </>
        ) : (
          <>
            <button style={styles.changeBtn} onClick={handleChangeNumber}>
              ← Change Number
            </button>

            <img src="/logo.png" alt="AddaLudo" style={styles.logoImage} />

            <h2 style={styles.title}>Verify OTP</h2>

            <p style={styles.subtitle}>OTP sent to +91 {phone}</p>

            <div style={styles.otpRow}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRef.current[index] = el)}
                  style={styles.otpInput}
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleBackspace(e, index)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button style={styles.button} onClick={verifyOTP} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <p
              style={{
                ...styles.resend,
                ...(timer > 0 ? { cursor: "default" } : {}),
              }}
              onClick={() => {
                if (timer === 0 && !loading) sendOTP();
              }}
            >
              {timer > 0
                ? `Resend OTP in 00:${String(timer).padStart(2, "0")}`
                : "Resend OTP"}
            </p>
          </>
        )}

        {successMessage && !error && showOtp && (
          <p style={styles.successMsg}>{successMessage}</p>
        )}

        {error && <p style={styles.errorMsg}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#ffffff",
    padding: "20px",
    fontFamily: "Poppins, Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    borderRadius: "22px",
    padding: "35px",
    boxShadow: "0 15px 40px rgba(0,0,0,.12)",
    textAlign: "center",
    position: "relative",
  },

  logoImage: {
    width: "220px",
    height: "auto",
    display: "block",
    margin: "0 auto 25px",
    objectFit: "contain",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: "30px",
    color: "#6b7280",
    fontSize: "15px",
  },

  mobileBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "15px",
  },

  referBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "20px",
  },

  country: {
    width: "70px",
    height: "52px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f9fafb",
    borderRight: "1px solid #e5e7eb",
    fontWeight: "700",
    color: "#111827",
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "15px",
    fontSize: "16px",
    background: "#fff",
  },

  button: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "5px",
  },

  note: {
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  changeBtn: {
    position: "absolute",
    left: "20px",
    top: "20px",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  otpRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "25px",
  },

  otpInput: {
    width: "52px",
    height: "58px",
    border: "2px solid #d1d5db",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "700",
    outline: "none",
  },

  resend: {
    marginTop: "18px",
    color: "#2563eb",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },

  successMsg: {
    marginTop: "18px",
    color: "#16a34a",
    fontWeight: "600",
    fontSize: "14px",
  },

  errorMsg: {
    marginTop: "18px",
    color: "#dc2626",
    fontWeight: "600",
    fontSize: "14px",
  },
};
