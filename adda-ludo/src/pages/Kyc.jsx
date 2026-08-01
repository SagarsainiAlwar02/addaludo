import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ---------------- design tokens ---------------- */
const COLORS = {
  ink: "#0b2b22",
  paper: "#f5f8f6",
  card: "#ffffff",
  brand: "#149268",
  brandDark: "#0e6f4f",
  border: "#e1e8e4",
  muted: "#64766e",
  danger: "#dc4c3e",
  warn: "#de8b32",
  okBg: "#e7f6ef",
  warnBg: "#fdf1e4",
};

const DOC_TYPES = [
  {
    value: "aadhar",
    label: "Aadhar",
    placeholder: "XXXX XXXX XXXX",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
        <rect x="3" y="5" width="18" height="14" rx="2.2" />
        <circle cx="8.4" cy="12" r="2.1" />
        <path d="M13 10h5M13 14h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "pan",
    label: "PAN",
    placeholder: "ABCDE1234F",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
        <rect x="3" y="4" width="18" height="16" rx="2.2" />
        <path d="M7 9h10M7 13h10M7 17h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "passport",
    label: "Passport",
    placeholder: "A1234567",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
        <rect x="4" y="3" width="16" height="18" rx="2.2" />
        <circle cx="12" cy="10" r="2.6" />
        <path d="M8 17c0.6-2 2-3 4-3s3.4 1 4 3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const SEAL_R = 26;
const SEAL_C = 2 * Math.PI * SEAL_R;

function Seal({ progress = 0, color = COLORS.brand, trackColor = COLORS.border, icon, size = 60 }) {
  const offset = SEAL_C * (1 - progress);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      <svg viewBox="0 0 60 60" width={size} height={size}>
        <circle cx="30" cy="30" r={SEAL_R} fill="none" stroke={trackColor} strokeWidth="4" />
        <circle
          cx="30"
          cy="30"
          r={SEAL_R}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={SEAL_C}
          strokeDashoffset={offset}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "30px 30px",
            transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

const CheckIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width={size} height={size}>
    <path d="M5 13l4.5 4.5L19 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ClockIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={size} height={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CrossIcon = ({ size = 17 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width={size} height={size}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);
const ShieldIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={size} height={size}>
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
  </svg>
);

const statusCopy = {
  not_submitted: "Not submitted",
  pending: "Under review",
  approved: "Approved",
  rejected: "Needs attention",
};

/* ---------------- inline style objects (kept in-file, like the original) ---------------- */
const styles = {
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: "26px 22px 28px",
    boxShadow: "0 1px 2px rgba(11,43,34,0.04), 0 12px 28px -18px rgba(11,43,34,0.35)",
    fontFamily: "'Inter', sans-serif",
    color: COLORS.ink,
  },
  head: { display: "flex", alignItems: "center", gap: 16, marginBottom: 18 },
  eyebrow: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: COLORS.brand,
  },
  headTitle: {
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    fontSize: "1.32rem",
    fontWeight: 700,
    margin: "2px 0 4px",
    letterSpacing: "-0.01em",
  },
  headDesc: { margin: 0, fontSize: "0.86rem", color: COLORS.muted, lineHeight: 1.4 },
  banner: (tone) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 10,
    fontSize: "0.84rem",
    fontWeight: 600,
    marginBottom: 16,
    background: tone === "ok" ? COLORS.okBg : COLORS.warnBg,
    color: tone === "ok" ? COLORS.brandDark : "#9a5312",
  }),
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  input: (error) => ({
    border: `1.5px solid ${error ? COLORS.danger : COLORS.border}`,
    background: error ? "#fdf2f1" : COLORS.paper,
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    color: COLORS.ink,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  }),
  inputMono: {
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.04em",
    fontWeight: 500,
  },
  hint: { fontSize: "0.76rem", color: COLORS.danger, fontWeight: 500 },
  microcopy: { fontSize: "0.74rem", color: COLORS.muted },
  docTabs: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  docTab: (active) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "12px 6px",
    border: `1.5px solid ${active ? COLORS.brand : COLORS.border}`,
    background: active ? COLORS.okBg : COLORS.paper,
    borderRadius: 10,
    fontSize: "0.78rem",
    fontWeight: 600,
    color: active ? COLORS.brandDark : COLORS.muted,
    cursor: "pointer",
  }),
  btnSubmit: (disabled) => ({
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    fontFamily: "'Inter', sans-serif",
    background: COLORS.brand,
    color: "#ffffff",
    marginTop: 4,
    width: "100%",
    opacity: disabled ? 0.65 : 1,
  }),
  btnDark: {
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    padding: 14,
    fontFamily: "'Inter', sans-serif",
    background: COLORS.ink,
    color: "#ffffff",
    width: "100%",
    marginTop: 22,
  },
  statusCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: "34px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  },
  statusTitle: {
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    fontSize: "1.3rem",
    margin: "14px 0 8px",
    color: COLORS.ink,
  },
  statusDesc: { margin: 0, color: COLORS.muted, fontSize: "0.88rem", lineHeight: 1.5, maxWidth: 320 },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "40px 0",
    color: COLORS.muted,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.88rem",
  },
};

/* Keyframes + :focus states can't be expressed as inline style objects,
   so this tiny scoped <style> tag (still inside this same file) covers just those. */
const KycStyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .kyc-input:focus { border-color: ${COLORS.brand} !important; background: #ffffff !important; }
    .kyc-spin { animation: kycSpin 0.7s linear infinite; }
    @keyframes kycSpin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .kyc-spin { animation: none; }
    }
  `}</style>
);

export default function Kyc() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", dob: "", docType: "aadhar", docNumber: "" });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token) {
          setKycStatus(storedUser.kycStatus || "not_submitted");
          return;
        }

        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data?.user || res.data || {};
        const status = user.kycStatus || "not_submitted";
        setKycStatus(status);

        localStorage.setItem("user", JSON.stringify({ ...storedUser, ...user, kycStatus: status }));
      } catch (err) {
        console.log("KYC status fetch error:", err.response?.data || err.message);
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setKycStatus(storedUser.kycStatus || "not_submitted");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchKycStatus();
  }, []);

  const activeDoc = DOC_TYPES.find((d) => d.value === form.docType) || DOC_TYPES[0];

  const isAdult = (dob) => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  };

  const docNumberValid = useMemo(() => {
    const v = form.docNumber.replace(/\s/g, "").toUpperCase();
    if (form.docType === "aadhar") return /^\d{12}$/.test(v);
    if (form.docType === "pan") return /^[A-Z]{5}\d{4}[A-Z]$/.test(v);
    return /^[A-Z0-9]{6,9}$/.test(v);
  }, [form.docNumber, form.docType]);

  const nameValid = form.name.trim().length >= 3;
  const dobValid = isAdult(form.dob);

  const progress = useMemo(() => {
    const done = [nameValid, dobValid, docNumberValid].filter(Boolean).length;
    return done / 3;
  }, [nameValid, dobValid, docNumberValid]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDocNumber = (e) => {
    let v = e.target.value.toUpperCase();
    if (form.docType === "aadhar") {
      v = v.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
    } else if (form.docType === "pan") {
      v = v.replace(/[^A-Z0-9]/g, "").slice(0, 10);
    } else {
      v = v.replace(/[^A-Z0-9]/g, "").slice(0, 9);
    }
    setForm({ ...form, docNumber: v });
  };

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, dob: true, docNumber: true });

    if (kycStatus === "approved" || kycStatus === "pending") return;
    if (!nameValid || !dobValid || !docNumberValid) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again");
        navigate("/login");
        return;
      }

      const res = await axios.post(
        `${API_URL}/kyc/submit`,
        {
          name: form.name.trim(),
          dob: form.dob,
          docType: form.docType,
          docNumber: form.docNumber.replace(/\s/g, ""),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newStatus = res.data?.kycStatus || "pending";
      setKycStatus(newStatus);
      setSuccess(true);

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...storedUser, kycStatus: newStatus }));

      setForm({ name: "", dob: "", docType: "aadhar", docNumber: "" });
      setTouched({});
    } catch (error) {
      console.log("KYC submit error:", error.response?.data || error.message);
      alert(error.response?.data?.msg || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="page-container">
        <KycStyleTag />
        <div style={styles.loadingWrap}>
          <div className="kyc-spin" style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.brand }} />
          <span>Loading verification status…</span>
        </div>
      </div>
    );
  }

  if (kycStatus === "approved") {
    return (
      <div className="page-container">
        <KycStyleTag />
        <div style={styles.statusCard}>
          <Seal progress={1} color={COLORS.brand} icon={<CheckIcon />} size={68} />
          <h2 style={styles.statusTitle}>You're verified</h2>
          <p style={styles.statusDesc}>Your identity has been confirmed. Withdrawals and premium matches are unlocked.</p>
          <button style={styles.btnDark} onClick={() => navigate("/profile")}>Back to profile</button>
        </div>
      </div>
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="page-container">
        <KycStyleTag />
        <div style={styles.statusCard}>
          <Seal progress={1} color={COLORS.warn} trackColor={COLORS.warnBg} icon={<ClockIcon />} size={68} />
          <h2 style={styles.statusTitle}>Under review</h2>
          <p style={styles.statusDesc}>We've received your details. This usually takes a few hours — you'll be notified once it's done.</p>
          <button style={styles.btnDark} onClick={() => navigate("/profile")}>Back to profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <KycStyleTag />
      <div style={styles.card}>
        <div style={styles.head}>
          <Seal progress={progress} color={COLORS.brand} icon={<ShieldIcon />} />
          <div>
            <span style={styles.eyebrow}>Identity verification</span>
            <h2 style={styles.headTitle}>Offline KYC </h2>
            <p style={styles.headDesc}>Takes under a minute. Unlocks withdrawals and premium matches.</p>
          </div>
        </div>

        {kycStatus === "rejected" && (
          <div style={styles.banner("warn")}>
            <CrossIcon />
            <span>Your last submission needed attention. Please check your details and resubmit.</span>
          </div>
        )}

        {success && (
          <div style={styles.banner("ok")}>
            <CheckIcon size={17} />
            <span>Submitted for review. Status: {statusCopy[kycStatus]}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="name">Legal full name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={() => markTouched("name")}
              placeholder="As written on your document"
              className="kyc-input"
              style={styles.input(touched.name && !nameValid)}
              autoComplete="name"
            />
            {touched.name && !nameValid && <span style={styles.hint}>Enter your full name as per the document</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              onBlur={() => markTouched("dob")}
              className="kyc-input"
              style={styles.input(touched.dob && !dobValid)}
            />
            {touched.dob && !dobValid && <span style={styles.hint}>You must be 18 or older to verify</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Document type</label>
            <div style={styles.docTabs}>
              {DOC_TYPES.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  style={styles.docTab(form.docType === d.value)}
                  onClick={() => setForm({ ...form, docType: d.value, docNumber: "" })}
                >
                  {d.icon}
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="docNumber">{activeDoc.label} number</label>
            <input
              id="docNumber"
              type="text"
              name="docNumber"
              value={form.docNumber}
              onChange={handleDocNumber}
              onBlur={() => markTouched("docNumber")}
              placeholder={activeDoc.placeholder}
              className="kyc-input"
              style={{ ...styles.input(touched.docNumber && !docNumberValid), ...styles.inputMono }}
              autoComplete="off"
            />
            {touched.docNumber && !docNumberValid && (
              <span style={styles.hint}>Check the {activeDoc.label} number format</span>
            )}
            <span style={styles.microcopy}>Used only to verify your identity. Never shown publicly.</span>
          </div>

          <button type="submit" disabled={loading} style={styles.btnSubmit(loading)}>
            {loading ? (
              <>
                <span className="kyc-spin" style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff" }} />
                Submitting
              </>
            ) : (
              "Submit for review"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
