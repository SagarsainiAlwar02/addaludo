import React, { useRef, useState } from "react";

export default function Login() {
  const logoSrc = "/logo.png?v=2";
  const [mobile, setMobile] = useState("");
  const [referCode, setReferCode] = useState(""); // Refer Code State Added
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const otpRef = useRef([]);

  const sendOtp = () => {
    if (mobile.length !== 10) {
      alert("Please enter valid mobile number");
      return;
    }

    // TODO: Call Send OTP API (pass referCode along with mobile)
    console.log("Mobile:", mobile, "Refer Code:", referCode);
    setShowOtp(true);
  };

  const verifyOtp = () => {
    const code = otp.join("");

    if (code.length !== 6) {
      alert("Please enter 6 digit OTP");
      return;
    }

    // TODO: Verify OTP API
    alert("OTP Verified Successfully");
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {!showOtp ? (
          <>
            <img
              src={logoSrc}
              alt="AddaLudo"
              style={styles.logoImage}
            />
            <h2 style={styles.title}>Welcome Back</h2>

            <p style={styles.subtitle}>
              Login using your mobile number
            </p>

            {/* Mobile Input Box */}
            <div style={styles.mobileBox}>
              <div style={styles.country}>+91</div>

              <input
                style={styles.input}
                type="tel"
                placeholder="Enter Mobile Number"
                value={mobile}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setMobile(value);
                  }
                }}
              />
            </div>

            {/* Refer Code Box Added */}
            <div style={styles.referBox}>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter Refer Code (Optional)"
                value={referCode}
                onChange={(e) => setReferCode(e.target.value.toUpperCase())}
              />
            </div>

            <button
              style={styles.button}
              onClick={sendOtp}
            >
              Continue
            </button>

            <p style={styles.note}>
              By continuing you agree to our
              Terms & Conditions and Privacy Policy.
            </p>
          </>
        ) : (
          <>
            <button
              style={styles.changeBtn}
              onClick={() => {
                setShowOtp(false);
                setOtp(["", "", "", "", "", ""]);
              }}
            >
              ← Change Number
            </button>
            <img
              src={logoSrc}
              alt="AddaLudo"
              style={styles.logoImage}
            />

            <h2 style={styles.title}>
              Verify OTP
            </h2>

            <p style={styles.subtitle}>
              OTP sent to +91 {mobile}
            </p>

            <div style={styles.otpRow}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRef.current[index] = el)}
                  style={styles.otpInput}
                  value={digit}
                  maxLength={1}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handleBackspace(e, index)
                  }
                />
              ))}
            </div>

            <button
              style={styles.button}
              onClick={verifyOtp}
            >
              Verify OTP
            </button>

            <p style={styles.resend}>
              Resend OTP in 00:30
            </p>
          </>
        )}
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
};