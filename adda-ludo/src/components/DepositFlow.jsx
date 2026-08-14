import React, { useState, useEffect } from "react";
import api, { getError } from "../api.js";

/**
 * DepositFlow
 * New 2-step deposit flow (ported from the addafun demo).
 * Step 1: Enter amount. Step 2: Pay via UPI ID / QR (<= scanner limit) or
 * Bank details, then submit UTR + screenshot.
 *
 * Props:
 *  - payment  : payment settings from GET /payment/settings
 *  - onClose  : called when the user closes the overlay
 *  - onSuccess: called after a deposit request is submitted successfully
 */
export default function DepositFlow({ payment, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("500");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flowError, setFlowError] = useState("");

  // Lock the page scroll while the full-screen flow is open so nothing
  // shows through or scrolls behind the overlay.
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Payment settings -> fields expected by the demo UI
  const upiId = payment?.upiList?.[0] || "";
  const bankDetails = {
    name: payment?.bank?.name || "",
    accountNo: payment?.bank?.accountNumber || "",
    ifsc: payment?.bank?.ifsc || "",
  };
  // QR method is only valid up to the admin-configured scanner limit
  const scannerMax = Number(payment?.scanner?.max || 2000);
  const numericAmount = Number(amount) || 0;

  const handleAddAmount = (val) => {
    const currentVal = parseInt(amount) || 0;
    setAmount((currentVal + val).toString());
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numericAmount || numericAmount < 100) {
      setFlowError("Minimum deposit ₹100");
      return;
    }
    if (!utrNumber || utrNumber.trim().length < 12) {
      setFlowError("Enter 12-digit UTR Number");
      return;
    }
    if (!selectedFile) {
      setFlowError("Upload payment screenshot!");
      return;
    }

    try {
      setSubmitting(true);
      setFlowError("");

      const formData = new FormData();
      formData.append("amount", numericAmount);
      formData.append("utr", utrNumber.trim());
      formData.append("paymentMethod", numericAmount <= scannerMax ? "qr" : "upi");
      formData.append("screenshot", selectedFile);

      const res = await api.post("/transactions/deposit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const msg = res.data?.message || "Deposit request submitted";
      alert(msg);
      setIsModalOpen(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setFlowError(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <style>{`
        @keyframes dfStepIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dfPop { from { opacity: 0; transform: translateY(26px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes dfFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dfFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes dfGlowPulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }

        .df-step { animation: dfStepIn .32s ease-out; }
        .df-modal { animation: dfPop .28s cubic-bezier(.16,1,.3,1); }
        .df-backdrop { animation: dfFade .22s ease-out; }

        .df-btn { transition: transform .12s ease, filter .15s ease, box-shadow .25s ease; }
        .df-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .df-btn:active { transform: scale(.97); }

        .df-chip { transition: background .18s ease, transform .12s ease, border-color .18s ease, box-shadow .2s ease; }
        .df-chip:hover { background: rgba(255,255,255,.22) !important; border-color: rgba(255,255,255,.6) !important; box-shadow: 0 4px 14px rgba(56,189,248,.18) !important; }
        .df-chip:active { transform: scale(.94); }

        .df-copy { transition: all .18s ease; }
        .df-copy:hover { background: linear-gradient(135deg,#2563eb,#06b6d4) !important; color: #fff !important; box-shadow: 0 4px 12px rgba(37,99,235,.3) !important; }

        .df-input { transition: border-color .18s ease, box-shadow .18s ease; }
        .df-input:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

        .df-upload { transition: all .2s ease; }
        .df-upload:hover { border-color: #60a5fa !important; background: linear-gradient(135deg,#eff6ff,#ecfeff) !important; }

        .df-card { transition: transform .18s ease, box-shadow .22s ease; }
        .df-card:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(99,102,241,.14) !important; }

        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Decorative background glows (behind everything) */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      {/* Sticky Header */}
      <div style={styles.header}>
        <button type="button" onClick={onClose} style={styles.headerIconBtn} aria-label="Close">
          ✕
        </button>
        <div style={styles.brandGroup}>
          <span style={styles.brandLogo}>⚔️</span>
          <span style={styles.brandText}>AddaLudo</span>
        </div>
        <span style={styles.stepPill}>{step === 1 ? "1/2" : "2/2"}</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressWrap}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: step === 1 ? "50%" : "100%",
            }}
          />
        </div>
        <span style={styles.progressLabel}>
          {step === 1 ? "Enter Amount" : "Complete Payment"}
        </span>
      </div>

      <div style={styles.body}>
        {/* Inline error banner (kept inside the flow so nothing overlays it) */}
        {flowError && (
          <div style={styles.inlineError} onClick={() => setFlowError("")}>
            <span style={styles.inlineErrorIcon}>⚠️</span>
            <span style={{ flex: 1 }}>{flowError}</span>
            <span style={styles.inlineErrorClose}>×</span>
          </div>
        )}

        {/* STEP 1: Amount Selection */}
        {step === 1 && (
          <div className="df-step" key="step1">
            {/* Top Notice Banner */}
            <div style={styles.noticeBanner}>
              <span style={styles.noticeIcon}>👉</span>
              <span>जितना Payment add करना है वो अमाउंट भर के Next पर क्लिक करें 🙏</span>
            </div>

            {/* Dark Blue Main Card */}
            <div style={styles.amountCard}>
              <div style={styles.cardGlowTop} />
              <div style={styles.cardGlowBottom} />
              <p style={styles.amountTitle}>Enter Amount to Add</p>

              {/* Amount Display */}
              <div style={styles.amountInputRow}>
                <span style={styles.rupeeSymbol}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={styles.amountInput}
                />
              </div>

              <p style={styles.minMaxHint}>Min: ₹100 • Max: ₹1,00,000</p>

              {/* Quick Add Buttons Grid */}
              <div style={styles.quickGrid}>
                {[300, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddAmount(val)}
                    className="df-chip"
                    style={styles.quickBtn}
                  >
                    <span style={styles.quickCoin}>₹</span>
                    +{val}
                  </button>
                ))}
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={() => {
                  if (numericAmount < 100) {
                    setFlowError("Minimum deposit ₹100");
                    return;
                  }
                  if (numericAmount > 100000) {
                    setFlowError("Maximum deposit ₹1,00,000");
                    return;
                  }
                  setFlowError("");
                  setStep(2);
                }}
                className="df-btn"
                style={styles.proceedBtn}
              >
                Proceed to Pay
                <span style={styles.proceedArrow}>→</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Details */}
        {step === 2 && (
          <div className="df-step" key="step2">
            {/* Header Amount & Edit Row */}
            <div className="df-card" style={styles.summaryCard}>
              <div>
                <p style={styles.summaryLabel}>Amount to be added</p>
                <p style={styles.summaryAmount}>₹{amount}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="df-btn"
                style={styles.editBtn}
              >
                ✏️ Edit
              </button>
            </div>

            {/* Instruction Banner */}
            <div style={styles.instructionBanner}>
              <span style={styles.instructionIcon}>💳</span>
              <span>Payment successfull होने के बाद स्क्रीनशॉट और UTR नंबर डालके सबमिट करें 🙏</span>
            </div>

            <h3 style={styles.payTitle}>
              नीचे दी हुई UPI Or QR पर भुगतान करें
            </h3>

            {/* UPI ID Card */}
            <div className="df-card" style={styles.upiCard}>
              <span style={styles.upiBadge}>UPI ID</span>
              <span style={styles.upiValue}>{upiId || "—"}</span>
              <button
                type="button"
                onClick={() => handleCopy(upiId)}
                className={copied ? "" : "df-copy"}
                style={copied ? styles.copyBtnCopied : styles.copyBtn}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            {/* Conditional Display: QR Code (<= 20000) OR Bank Account Details (> 20000) */}
            {numericAmount <= 20000 ? (
              <div className="df-card" style={styles.qrCard}>
                <div style={styles.qrInner}>
                  {upiId ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&am=${amount}`}
                      alt="Payment QR"
                      style={styles.qrImg}
                    />
                  ) : (
                    <div style={styles.qrFallback}>UPI ID not available</div>
                  )}
                </div>
                <p style={styles.qrCaption}>
                  📱 Scan this QR with any UPI app
                  <span style={styles.qrAmount}>Pay ₹{amount}</span>
                </p>
              </div>
            ) : (
              <div className="df-card" style={styles.bankCard}>
                <div style={styles.bankHeader}>
                  <span style={styles.bankHeaderIcon}>🏦</span> Bank Account Details
                </div>
                <div style={styles.bankRow}>
                  <div style={styles.bankInfo}>
                    <small style={styles.bankLabel}>ACCOUNT NAME</small>
                    <div style={styles.bankValue}>{bankDetails.name || "—"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.name)}
                    className="df-copy"
                    style={styles.bankCopyBtn}
                  >
                    Copy
                  </button>
                </div>
                <div style={styles.bankDivider} />
                <div style={styles.bankRow}>
                  <div style={styles.bankInfo}>
                    <small style={styles.bankLabel}>ACCOUNT NUMBER</small>
                    <div style={styles.bankValue}>{bankDetails.accountNo || "—"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.accountNo)}
                    className="df-copy"
                    style={styles.bankCopyBtn}
                  >
                    Copy
                  </button>
                </div>
                <div style={styles.bankDivider} />
                <div style={styles.bankRow}>
                  <div style={styles.bankInfo}>
                    <small style={styles.bankLabel}>IFSC CODE</small>
                    <div style={styles.bankValue}>{bankDetails.ifsc || "—"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.ifsc)}
                    className="df-copy"
                    style={styles.bankCopyBtn}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Green Upload Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="df-btn"
              style={styles.uploadBtn}
            >
              📤 Upload Payment Details
            </button>
          </div>
        )}
      </div>

      {/* Floating Modal (Top Right Cross Button Included) */}
      {isModalOpen && (
        <div className="df-backdrop" style={styles.modalBackdrop}>
          <div className="df-modal" style={styles.modal}>
            {/* TOP RIGHT CROSS CANCEL BUTTON */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={styles.modalCloseBtn}
              aria-label="Close"
            >
              ✕
            </button>

            <div style={styles.modalIcon}>💸</div>
            <h3 style={styles.modalTitle}>Submit Payment Details</h3>
            <p style={styles.modalSub}>Deposit request will be verified by admin</p>

            <form onSubmit={handleSubmit}>
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>AMOUNT</label>
                <input
                  type="text"
                  value={`₹${amount}`}
                  disabled
                  style={styles.fieldAmount}
                />
              </div>

              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>12 DIGIT UTR NUMBER</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Enter 12 Digit UTR Number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  required
                  className="df-input"
                  style={styles.fieldInput}
                />
              </div>

              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>PAYMENT SCREENSHOT</label>
                <label className="df-upload" style={selectedFile ? styles.uploadAreaSelected : styles.uploadArea}>
                  {selectedFile ? (
                    <span style={styles.uploadSelected}>
                      <span style={styles.uploadCheck}>✓</span> {selectedFile.name}
                    </span>
                  ) : (
                    <span style={styles.uploadPlaceholder}>
                      <span style={styles.uploadIcon}>📷</span>
                      Upload Payment Screenshot
                      <small style={styles.uploadHint}>Tap to choose an image</small>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="df-btn"
                style={{ ...styles.submitBtn, opacity: submitting ? 0.65 : 1 }}
              >
                {submitting ? "⏳ Submitting..." : "Submit Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(180deg, #020617 0%, #0b1a33 130px, #0f172a 190px, #f8fafc 190px)",
    color: "#0f172a",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflowY: "auto",
    zIndex: 9998,
  },

  // ---- Decorative glows (kept within the scroll container so they fade
  // softly instead of being hard-clipped at the viewport edges) ----
  glowTop: {
    position: "absolute",
    top: -140,
    right: 0,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,211,238,.28) 0%, rgba(34,211,238,0) 65%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  glowBottom: {
    position: "absolute",
    top: -60,
    left: 0,
    width: 340,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,.30) 0%, rgba(59,130,246,0) 65%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  // ---- Header ----
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "linear-gradient(120deg, #0f172a 0%, #1d3a63 48%, #0f172a 100%)",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(56,189,248,0.25)",
    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  headerIconBtn: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#f8fafc",
    width: 36,
    height: 36,
    borderRadius: "50%",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all .18s ease",
  },
  brandGroup: { display: "flex", alignItems: "center", gap: 8 },
  brandLogo: { fontSize: 20, filter: "drop-shadow(0 2px 6px rgba(34,211,238,.4))" },
  brandText: {
    fontSize: 19,
    fontWeight: 900,
    letterSpacing: "0.4px",
    background: "linear-gradient(to right, #60a5fa, #38bdf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  stepPill: {
    fontSize: 12,
    fontWeight: 900,
    color: "#a5f3fc",
    background: "linear-gradient(135deg, rgba(34,211,238,.18), rgba(59,130,246,.18))",
    border: "1px solid rgba(34, 211, 238, 0.35)",
    padding: "5px 12px",
    borderRadius: 20,
    letterSpacing: "0.06em",
    boxShadow: "0 0 12px rgba(34,211,238,.15)",
  },

  // ---- Progress ----
  progressWrap: { padding: "14px 18px 0", background: "transparent", position: "relative", zIndex: 1 },
  progressTrack: {
    height: 6,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    background: "linear-gradient(90deg, #38bdf8, #3b82f6)",
    transition: "width .35s cubic-bezier(.16,1,.3,1)",
    boxShadow: "0 0 12px rgba(56,189,248,.6)",
  },
  progressLabel: {
    display: "block",
    marginTop: 8,
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  // ---- Body ----
  body: { maxWidth: 440, margin: "0 auto", padding: "18px 16px 48px", position: "relative", zIndex: 1 },

  inlineError: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
    border: "1px solid #fecaca",
    borderLeft: "4px solid #ef4444",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.45,
    marginBottom: 14,
    boxShadow: "0 4px 14px rgba(239,68,68,.14)",
    cursor: "pointer",
    animation: "dfStepIn .25s ease-out",
  },
  inlineErrorIcon: { flexShrink: 0 },
  inlineErrorClose: { fontSize: 17, fontWeight: 900, color: "#b91c1c", flexShrink: 0 },

  // ---- Step 1 ----
  noticeBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    border: "1px solid #bfdbfe",
    borderLeft: "4px solid #3b82f6",
    color: "#1e40af",
    padding: "13px 14px",
    borderRadius: 14,
    fontSize: 13.5,
    fontWeight: 700,
    lineHeight: 1.5,
    marginBottom: 16,
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.14)",
  },
  noticeIcon: { fontSize: 18, flexShrink: 0 },

  amountCard: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(150deg, #08214e 0%, #1e40af 100%)",
    padding: "26px 22px",
    borderRadius: 24,
    boxShadow: "0 18px 45px rgba(29, 78, 216, 0.35), 0 0 0 1px rgba(255,255,255,.08)",
    color: "#ffffff",
  },
  cardGlowTop: {
    position: "absolute",
    top: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,211,238,.4) 0%, rgba(34,211,238,0) 65%)",
    pointerEvents: "none",
    animation: "dfGlowPulse 3.2s ease-in-out infinite",
  },
  cardGlowBottom: {
    position: "absolute",
    bottom: -80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,.35) 0%, rgba(59,130,246,0) 65%)",
    pointerEvents: "none",
  },
  amountTitle: { position: "relative", margin: "0 0 18px", fontSize: 17, fontWeight: 800, letterSpacing: "0.2px" },

  amountInputRow: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderBottom: "2px solid rgba(255,255,255,0.85)",
    marginBottom: 10,
    paddingBottom: 8,
    gap: 8,
  },
  rupeeSymbol: { fontSize: 30, fontWeight: 900, color: "#38bdf8", textShadow: "0 2px 8px rgba(56,189,248,.4)" },
  amountInput: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: 30,
    fontWeight: 900,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  },

  minMaxHint: {
    position: "relative",
    margin: 0,
    fontSize: 12.5,
    color: "#bae6fd",
    fontWeight: 700,
    letterSpacing: "0.3px",
    marginBottom: 22,
  },

  quickGrid: { position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 },
  quickBtn: {
    background: "linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.06))",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#ffffff",
    padding: "13px",
    borderRadius: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backdropFilter: "blur(4px)",
  },
  quickCoin: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    width: 22,
    height: 22,
    borderRadius: "50%",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    boxShadow: "0 2px 6px rgba(0,0,0,0.3), 0 0 10px rgba(59,130,246,.4)",
  },

  proceedBtn: {
    position: "relative",
    width: "100%",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #06b6d4 100%)",
    color: "#ffffff",
    border: "none",
    padding: "16px",
    borderRadius: 16,
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(37, 99, 235, 0.45), 0 0 0 1px rgba(255,255,255,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  proceedArrow: { fontSize: 19, transition: "transform .2s ease" },

  // ---- Step 2 ----
  summaryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid #3b82f6",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 14,
    boxShadow: "0 6px 18px rgba(59, 130, 246, 0.10)",
  },
  summaryLabel: { margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" },
  summaryAmount: {
    margin: "3px 0 0",
    fontSize: 22,
    fontWeight: 900,
    background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  editBtn: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    padding: "9px 16px",
    borderRadius: 10,
    fontSize: 13.5,
    fontWeight: 800,
    cursor: "pointer",
  },

  instructionBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(135deg, #0f172a 0%, #1d3a63 100%)",
    color: "#f1f5f9",
    padding: "13px 15px",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.55,
    marginBottom: 18,
    borderLeft: "4px solid #22d3ee",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.22)",
  },
  instructionIcon: { fontSize: 18, flexShrink: 0 },

  payTitle: {
    margin: 0,
    fontSize: 16.5,
    fontWeight: 800,
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 14,
  },

  upiCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 14,
    padding: "11px 14px",
    marginBottom: 14,
    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.09)",
  },
  upiBadge: {
    flexShrink: 0,
    background: "linear-gradient(135deg, #2563eb, #0891b2)",
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: 900,
    padding: "4px 9px",
    borderRadius: 8,
    letterSpacing: "0.04em",
    boxShadow: "0 2px 8px rgba(59,130,246,.3)",
  },
  upiValue: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 800,
    fontSize: 14.5,
    background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  copyBtn: { background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0, boxShadow: "0 3px 10px rgba(2,132,199,.3)" },
  copyBtnCopied: { background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0, boxShadow: "0 3px 10px rgba(59,130,246,.3)" },

  qrCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 18,
    padding: "18px 18px 14px",
    marginBottom: 18,
    boxShadow: "0 10px 28px rgba(59, 130, 246, 0.12)",
  },
  qrInner: {
    display: "flex",
    justifyContent: "center",
    padding: 12,
    background: "linear-gradient(135deg, #f8fafc, #eff6ff)",
    borderRadius: 14,
    border: "1px dashed #93c5fd",
  },
  qrImg: { width: 200, height: 200, display: "block", borderRadius: 8, boxShadow: "0 8px 24px rgba(59,130,246,.18)" },
  qrFallback: { padding: "70px 20px", color: "#64748b", fontSize: 13, fontWeight: 700 },
  qrCaption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    margin: "12px 0 0",
    fontSize: 12.5,
    color: "#64748b",
    fontWeight: 700,
  },
  qrAmount: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb, #06b6d4)",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 900,
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
  },

  bankCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 18,
    padding: "16px 16px 6px",
    marginBottom: 18,
    boxShadow: "0 10px 28px rgba(59, 130, 246, 0.12)",
  },
  bankHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13.5,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 10,
    background: "linear-gradient(135deg, #0284c7, #2563eb)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  bankHeaderIcon: { WebkitTextFillColor: "#0284c7" },
  bankRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0" },
  bankInfo: { minWidth: 0 },
  bankLabel: { color: "#94a3b8", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em" },
  bankValue: { marginTop: 2, fontWeight: 900, fontSize: 14.5, color: "#0f172a", wordBreak: "break-all" },
  bankDivider: { height: 1, background: "linear-gradient(90deg, #e2e8f0, #bfdbfe, #e2e8f0)" },
  bankCopyBtn: {
    flexShrink: 0,
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    border: "1px solid #e2e8f0",
    color: "#475569",
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  uploadBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #2563eb, #06b6d4)",
    color: "#ffffff",
    border: "none",
    padding: "15px",
    borderRadius: 14,
    fontSize: 16.5,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255,255,255,.1)",
  },

  // ---- Modal ----
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(5, 8, 22, 0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
  },
  modal: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)",
    color: "#0f172a",
    borderRadius: 22,
    width: "100%",
    maxWidth: 380,
    padding: "26px 22px 22px",
    position: "relative",
    boxShadow: "0 25px 60px -12px rgba(5, 8, 22, 0.5), 0 0 0 1px rgba(59,130,246,.15)",
    overflow: "hidden",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
    border: "none",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalIcon: {
    width: 56,
    height: 56,
    margin: "0 auto 10px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    background: "linear-gradient(135deg, #eff6ff, #ecfeff)",
    border: "1px solid #bfdbfe",
    boxShadow: "0 6px 16px rgba(59,130,246,.2)",
  },
  modalTitle: {
    margin: "0 0 4px",
    textAlign: "center",
    fontSize: 19,
    fontWeight: 900,
    background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  modalSub: { margin: "0 0 18px", textAlign: "center", fontSize: 12, color: "#94a3b8", fontWeight: 700 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 900,
    color: "#64748b",
    letterSpacing: "0.07em",
    marginBottom: 6,
  },
  fieldAmount: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
    border: "1px solid #bfdbfe",
    borderRadius: 11,
    boxSizing: "border-box",
    fontWeight: 900,
    fontSize: 16,
    color: "#1d4ed8",
    fontFamily: "inherit",
  },
  fieldInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: 11,
    boxSizing: "border-box",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    letterSpacing: "0.03em",
  },
  uploadArea: {
    display: "block",
    background: "linear-gradient(135deg, #f8fafc, #eff6ff)",
    border: "2px dashed #93c5fd",
    padding: "16px",
    textAlign: "center",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    color: "#1e40af",
    fontWeight: 800,
  },
  uploadAreaSelected: {
    display: "block",
    background: "linear-gradient(135deg, #eff6ff, #ecfeff)",
    border: "2px solid #93c5fd",
    padding: "14px",
    textAlign: "center",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    color: "#1e40af",
    fontWeight: 800,
  },
  uploadPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  uploadIcon: { fontSize: 24 },
  uploadHint: { fontSize: 11, color: "#94a3b8", fontWeight: 600 },
  uploadSelected: { display: "inline-flex", alignItems: "center", gap: 8, wordBreak: "break-all" },
  uploadCheck: {
    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    color: "#fff",
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    flexShrink: 0,
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    color: "#ffffff",
    border: "none",
    padding: "14px",
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 15.5,
    cursor: "pointer",
    marginTop: 4,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.35)",
  },
};
