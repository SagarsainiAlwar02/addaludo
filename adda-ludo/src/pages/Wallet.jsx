import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";

const SERVER_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function Wallet() {
  const navigate = useNavigate();
  const MIN_AMOUNT = 100;
  const MAX_AMOUNT = 100000;

  const [wallet, setWallet] = useState({
    balance: 0,
    winnings: 0,
    bonus: 0,
    locked: 0,
  });

  // KYC State Added
  const [kycStatus, setKycStatus] = useState("not_submitted");

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const [showAddCash, setShowAddCash] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [deposits, setDeposits] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [payment, setPayment] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [activeHistory, setActiveHistory] = useState("deposit");
  
  const [selectedMethod, setSelectedMethod] = useState(""); 

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const loadWallet = async () => {
    const res = await api.get("/user/profile");
    const data = getData(res);
    const w = data?.wallet || {};
    setWallet({
      balance: w.balance || 0,
      winnings: w.winnings || 0,
      bonus: w.bonus || 0,
      locked: w.locked || 0,
    });
  };

  const loadKycStatus = async () => {
    try {
      const res = await api.get("/user/profile");
      const data = getData(res);
      setKycStatus(data?.user?.kycStatus || "not_submitted");
    } catch (err) {
      console.log("KYC status check error:", getError(err));
    }
  };

  const loadDeposits = async () => {
    try {
      const res = await api.get("/transactions/deposits");
      const data = getData(res);
      setDeposits(data?.deposits || []);
    } catch (err) {
      console.log("Deposit load error:", getError(err));
    }
  };

  const loadWithdraws = async () => {
    try {
      const res = await api.get("/transactions/withdraws");
      const data = getData(res);
      setWithdraws(data?.withdraws || []);
    } catch (err) {
      console.log("Withdraw load error:", getError(err));
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const res = await api.get("/payment/settings");
      const data = getData(res);
      setPayment(data?.settings || data);
    } catch (err) {
      console.log("Payment setting load error:", getError(err));
    }
  };

  const init = async () => {
    try {
      setPageLoading(true);
      await Promise.all([
        loadWallet(),
        loadKycStatus(), // KYC status loaded here
        loadDeposits(),
        loadWithdraws(),
        loadPaymentSettings(),
      ]);
    } catch (err) {
      setError("Failed to load wallet");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    init();
    const refreshWallet = () => init();
    window.addEventListener("walletUpdated", refreshWallet);
    return () => window.removeEventListener("walletUpdated", refreshWallet);
  }, []);

  useEffect(() => {
    if (!showPayment) return;
    setTimeLeft(300);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPayment]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const copyText = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      alert("Copied");
    } catch {
      alert("Copy failed");
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "success" || s === "approved") return { background: "#dcfce7", color: "#166534" };
    if (s === "rejected" || s === "failed") return { background: "#fee2e2", color: "#991b1b" };
    return { background: "#fef3c7", color: "#92400e" };
  };

  const openAddCash = () => {
    setError("");
    setAmount("");
    setUtr("");
    setScreenshot(null);
    setSelectedMethod(""); 
    setShowAddCash(true);
    setShowPayment(false);
    loadPaymentSettings();
  };

  const goToPayment = () => {
    const addAmount = Number(amount);
    if (!addAmount) return setError("Please enter amount");
    if (addAmount < MIN_AMOUNT) return setError("Minimum add cash amount is ₹100");
    if (addAmount > MAX_AMOUNT) return setError("Maximum add cash amount is ₹1,0,000");

    setError("");
    setShowAddCash(false);
    setShowPayment(true);
  };

  const submitDeposit = async () => {
    const addAmount = Number(amount);
    if (!addAmount || addAmount < MIN_AMOUNT) return setError("Minimum deposit ₹100 ");
    if (addAmount > MAX_AMOUNT) return setError("Maximum deposit ₹1,0,0,000 hai");
    if (!utr.trim()) return setError("Enter UTR no.");
    if (!screenshot) return setError("Upload Payment Screenshot");

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("amount", addAmount);
      formData.append("utr", utr.trim());
      formData.append("paymentMethod", selectedMethod || "qr");
      formData.append("screenshot", screenshot);

      const res = await api.post("/transactions/deposit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const msg = res.data?.message || "Deposit request submitted";
      alert(msg);
      setShowPayment(false);
      setAmount("");
      setUtr("");
      setScreenshot(null);
      setSelectedMethod("");
      await Promise.all([loadDeposits(), loadWallet()]);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div style={styles.loading}>⏳ Loading Wallet...</div>;
  }

  const scannerPath = payment?.scannerImage || payment?.scanner?.image || "";
  const scannerImage = scannerPath ? `${SERVER_BASE}${scannerPath}` : "";
  const upiId = payment?.upiList?.[0] || "";
  const bank = payment?.bank || {};
  const numericAmount = Number(amount || 0);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header Row */}
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
          <h2 style={styles.title}>Wallet</h2>
          <span style={styles.online}>0 online</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* --- DEPOSIT CARD --- */}
        <div style={styles.cardRectangle}>
          <div style={styles.cardMainInline}>
            <div style={{ ...styles.iconBoxSmall, background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>💰</div>
            <div style={styles.infoFlex}>
              <p style={styles.label}>Deposit Coin</p>
              <h1 style={styles.amountText}>₹ {Number(wallet.balance || 0).toFixed(2)}</h1>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#f59e0b", fontWeight: "700" }}>
                🎁 Bonus: ₹ {Number(wallet.bonus || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <button style={styles.addBtnInline} onClick={openAddCash}>
                Add Cash <span style={styles.plus}>+</span>
              </button>
            </div>
          </div>
          <p style={styles.desc}>Use to play Tournaments & Battles. Cannot be withdrawn.</p>
        </div>

        {/* --- WINNING CARD WITH DYNAMIC KYC BUTTON --- */}
        <div style={styles.cardRectangle}>
          <div style={styles.cardMainInline}>
            <div style={{ ...styles.iconBoxSmall, background: "linear-gradient(135deg,#16a34a,#86efac)" }}>🏆</div>
            <div style={styles.infoFlex}>
              <p style={styles.label}>Winning Coin</p>
              <h1 style={styles.amountText}>₹ {Number(wallet.winnings || 0).toFixed(2)}</h1>
            </div>
            <div>
              {kycStatus === "approved" ? (
                <button style={styles.withdrawBtnInline} onClick={() => navigate("/withdraw")}>
                  Withdraw 🏦
                </button>
              ) : (
                <button style={styles.completeKycBtnInline} onClick={() => navigate("/kyc")}>
                  Complete KYC 📋
                </button>
              )}
            </div>
          </div>
          <p style={styles.desc}>Withdrawable to UPI or Bank. Also usable for play.</p>
        </div>

        {/* History Box Card */}
        <div style={styles.historyCard}>
          <div style={styles.historyTabs}>
            <button onClick={() => setActiveHistory("deposit")} style={{ ...styles.historyTab, ...(activeHistory === "deposit" ? styles.activeHistoryTab : {}) }}>Deposit History</button>
            <button onClick={() => setActiveHistory("withdraw")} style={{ ...styles.historyTab, ...(activeHistory === "withdraw" ? styles.activeHistoryTab : {}) }}>Withdraw History</button>
          </div>
          <HistoryBox
            empty={activeHistory === "deposit" ? "No deposit request yet." : "No withdraw request yet."}
            items={activeHistory === "deposit" ? deposits : withdraws}
            getStatusStyle={getStatusStyle}
            type={activeHistory === "deposit" ? "deposit" : "withdraw"}
          />
        </div>
      </div>

      {/* MODAL 1: ENTER AMOUNT INPUT */}
      {showAddCash && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setShowAddCash(false)}>×</button>
            <h2 style={styles.modalTitle}>Add Money</h2>
            <p style={styles.modalSub}>Minimum ₹100 To Maximum ₹1,0,000</p>
            <input
              type="number"
              value={amount}
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              placeholder="Enter Amount"
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
            <div style={styles.depositNoteBox}>
              <p style={styles.depositNoteLine}><b>NOTE :-</b>Please Enter UTR no Correctly.</p>
              <p style={styles.depositNoteLine}>Sahi se UTR enter kare Galt UTR fill karne par Payment add nhi hoga</p>
            </div>
            <button style={styles.payBtn} onClick={goToPayment}>Next </button>
          </div>
        </div>
      )}

      {/* MODAL 2: DYNAMIC GATEWAY PANEL */}
      {showPayment && (
        <div style={styles.paymentPage}>
          <div style={styles.paymentCard}>
            
            {/* Color Marked Premium Header Panel Box */}
            <div style={styles.headerContainer}>
              <button style={styles.backArrowStyle} onClick={() => { setShowPayment(false); setShowAddCash(true); }}>←</button>
              <div style={styles.brandGroupStyle}>
                <span style={{ fontSize: "18px" }}>⚔️</span> 
                <span style={styles.logoTextStyle}>AddaLudo</span>
              </div>
              <span style={styles.completePaymentTextStyle}>Complete Payment</span>
            </div>

            <div style={styles.paymentBody}>
              
              {/* Premium Attractive Styled Amount Box Dashboard */}
              <div style={styles.amountCardBox}>
                <p style={styles.payTextStyle}>Pay Amount</p>
                <h1 style={styles.amountTextStyle}>₹{numericAmount.toFixed(2)}</h1>
                <div style={styles.timerBoxStyle}>
                  <span>⏱️</span> Time remaining: <b>{formatTime(timeLeft)}</b>
                </div>
              </div>

              {/* DYNAMIC SELECTION MODES WITH COLOR ACTIVE LOOK */}
              <div style={{ marginBottom: 16, marginTop: 18 }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10, fontWeight: 'bold' }}>Select Payment Mode:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  
                  {/* ₹100 SE ₹2000 TAK: SCANNER AUR UPI ID BOTH OPTIONS */}
                  {numericAmount >= 100 && numericAmount <= 2000 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod("qr")}
                        style={selectedMethod === "qr" ? styles.methodBtnActive : styles.methodBtn}
                      >
                        QR Scanner
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod("upi")}
                        style={selectedMethod === "upi" ? styles.methodBtnActive : styles.methodBtn}
                      >
                        UPI ID
                      </button>
                    </>
                  )}

                  {/* ₹2000 SE UPER: UPI ID AUR BANK DETAILS BOTH OPTIONS */}
                  {numericAmount > 2000 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod("upi")}
                        style={selectedMethod === "upi" ? styles.methodBtnActive : styles.methodBtn}
                      >
                        UPI ID
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setSelectedMethod("bank")}
                        style={selectedMethod === "bank" ? styles.methodBtnActive : styles.methodBtn}
                      >
                        Bank Details
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* DETAILS DISPLAYER STRUCTURE */}
              {selectedMethod === "upi" && (
                upiId ? <CopyRow label="UPI ID" value={upiId} onCopy={copyText} /> : <div style={styles.noPaymentBox}>UPI ID not available</div>
              )}

              {selectedMethod === "qr" && (
                scannerImage ? (
                  <div style={styles.qrBox}>
                    <img src={scannerImage} alt="Payment QR" style={styles.qrImg} />
                  </div>
                ) : <div style={styles.noPaymentBox}>QR scanner not available</div>
              )}

              {selectedMethod === "bank" && (
                <div style={styles.bankDetailContainer}>
                  {bank?.name && <CopyRow label="Bank Name" value={bank.name} onCopy={copyText} />}
                  {bank?.accountNumber && <CopyRow label="Account Number" value={bank.accountNumber} onCopy={copyText} />}
                  {bank?.ifsc && <CopyRow label="IFSC Code" value={bank.ifsc} onCopy={copyText} />}
                </div>
              )}

              {error && <div style={styles.error}>{error}</div>}

              {/* PROOF UPLOADER FLOW */}
              {selectedMethod && (
                <div style={{ marginTop: 15 }}>
                  
                  {/* Updated Text Note Box As Requested */}
                  <div style={styles.noteBox}>
                   Note:- UPI और Scanner पर पेमेंट न होने पर सपोर्ट पर Contact करे !
                  </div>

                  <input
                    type="text"
                    value={utr}
                    placeholder="Enter UTR / Transaction ID"
                    onChange={(e) => setUtr(e.target.value)}
                    style={styles.input}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />

                  {screenshot && <p style={styles.small}>Selected: {screenshot.name}</p>}

                  <button style={styles.submitBtn} onClick={submitDeposit} disabled={loading}>
                    {loading ? "Verifying Proof..." : "Submit Payment Proof"}
                  </button>
                </div>
              )}

              {/* Cancel Button */}
              <button style={styles.cancelBtn} onClick={() => { setShowPayment(false); setSelectedMethod(""); }}>Cancel</button>
              <div style={styles.paymentInstruction}>
                👆 ऊपर QR Scanner और UPI ID का ऑप्शन दिया गया है, उस पर दबाये और पेमेंट करे !
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div style={styles.copyRow}>
      <div style={{ minWidth: 0 }}>
        <p style={styles.copyLabel}>{label}</p>
        <p style={styles.copyValue}>{value}</p>
      </div>
      <button style={styles.copyBtn} onClick={() => onCopy(value)}>Copy</button>
    </div>
  );
}

function HistoryBox({ empty, items, getStatusStyle, type }) {
  return (
    <div>
      {items.length === 0 ? (
        <p style={styles.desc}>{empty}</p>
      ) : (
        items.slice(0, 10).map((item) => (
          <div key={item._id} style={styles.depositItem}>
            <div>
              <b style={{ color: "#0f172a" }}>₹{item.amount}</b>
              <p style={styles.small}>{type === "deposit" ? `UTR: ${item.utr || "-"}` : `Method: ${item.method || "-"}`}</p>
              <p style={styles.small}>{item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "-"}</p>
            </div>
            <span style={{ ...styles.status, ...getStatusStyle(item.status) }}>{item.status || "pending"}</span>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f1f5f9", color: "#0f172a" },
  container: { padding: "72px 14px 105px", maxWidth: "480px", margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  backBtn: { width: 42, height: 42, borderRadius: 14, border: "none", background: "#fff", fontSize: 24, fontWeight: 900, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer" },
  title: { flex: 1, margin: 0, fontSize: 27, fontWeight: 900, color: "#0f172a" },
  online: { color: "#64748b", fontSize: 13, fontWeight: 700 },
  
  cardRectangle: { background: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "16px", boxShadow: "0 10px 30px rgba(15,23,42,.03)", border: "1px solid #e2e8f0" },
  cardMainInline: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  iconBoxSmall: { width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, flexShrink: 0 },
  infoFlex: { flex: 1, minWidth: 0 },
  
  label: { margin: "0 0 2px", color: "#64748b", fontSize: 13, fontWeight: 800 },
  amountText: { margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 900 },
  
  addBtnInline: { border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  withdrawBtnInline: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  
  // Dynamic Complete KYC Button Styling
  completeKycBtnInline: { border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 10px rgba(217,119,6,0.2)" },

  plus: { marginLeft: 3, fontSize: 15 },
  desc: { margin: "10px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.4 },
  
  error: { background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 12, marginBottom: 12, fontWeight: 800, fontSize: 13 },
  loading: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#475569" },
  
  historyCard: { background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 18px 45px rgba(15,23,42,.07)", border: "1px solid #e2e8f0" },
  historyTabs: { display: "flex", gap: "8px", marginBottom: "12px" },
  historyTab: { flex: 1, border: "none", background: "#f1f5f9", padding: "6px 10px", borderRadius: 8, fontWeight: 800, color: "#64748b", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" },
  activeHistoryTab: { background: "#2563eb", color: "#fff", boxShadow: "0 4px 10px rgba(37,99,235,0.15)" },
  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  status: { padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 900 },
  small: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", width: "100%", maxWidth: "400px", padding: 24, borderRadius: 22, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", position: "relative", margin: "0 12px", border: "1px solid #e2e8f0" },
  closeBtn: { position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 24, fontWeight: "bold", color: "#94a3b8", cursor: "pointer" },
  modalTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0f172a" },
  modalSub: { margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#64748b" },
  input: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", fontWeight: "700", outline: "none", boxSizing: "border-box" },
  depositNoteBox: { background: "#fffbeb", padding: "12px", borderRadius: "10px", border: "1px solid #fde68a", marginTop: "12px" },
  depositNoteLine: { fontSize: "11px", margin: "0 0 4px", color: "#b45309", fontWeight: "600", lineHeight: "1.4" },
  payBtn: { width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "900", marginTop: "14px", cursor: "pointer" },

  paymentPage: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#f8fafc", display: "flex", flexDirection: "column", zIndex: 110, overflowY: "auto" },
  paymentCard: { width: "100%", maxWidth: "480px", margin: "0 auto", padding: "14px", boxSizing: "border-box" },
  
  headerContainer: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "14px 16px", borderRadius: "14px", marginBottom: "16px", boxShadow: "0 4px 15px rgba(15, 23, 42, 0.15)", border: "1px solid rgba(255, 255, 255, 0.05)" },
  backArrowStyle: { fontSize: "20px", color: "#f8fafc", background: "rgba(255, 255, 255, 0.1)", width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none" },
  brandGroupStyle: { display: "flex", alignItems: "center", gap: "6px", color: "#fff" },
  logoTextStyle: { fontSize: "20px", fontWeight: "900", background: "linear-gradient(to right, #3b82f6, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.5px" },
  completePaymentTextStyle: { fontSize: "12px", fontWeight: "800", color: "#34d399", textTransform: "uppercase", backgroundColor: "rgba(52, 211, 153, 0.1)", padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.05em" },

  paymentBody: { width: "100%" },
  
  amountCardBox: { 
    background: "#ffffff", 
    border: "2px solid #0f172a", 
    borderRadius: "6px", 
    padding: "10px 14px", 
    textAlign: "center", 
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)" 
  },
  payTextStyle: { 
    fontSize: "12px", 
    fontWeight: "900", 
    color: "#64748b", 
    textTransform: "uppercase", 
    letterSpacing: "0.05em", 
    margin: 0 
  },
  amountTextStyle: { 
    fontSize: "26px", 
    fontWeight: "900", 
    color: "#0f172a", 
    letterSpacing: "-0.02em", 
    marginTop: "2px", 
    marginBottom: "2px", 
    margin: 0 
  },
  timerBoxStyle: { 
    display: "inline-flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: "4px", 
    background: "#fee2e2", 
    color: "#dc2626", 
    padding: "3px 10px", 
    borderRadius: "4px", 
    fontSize: "11px", 
    fontWeight: "800", 
    marginTop: "4px", 
    border: "1px solid #fca5a5" 
  },

  methodBtn: { background: "#fff", border: "2px solid #cbd5e1", color: "#475569", padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer" },
  methodBtnActive: { background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" },
  cancelBtn: { width: "100%", border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "14px", fontSize: "14px", fontWeight: "900", cursor: "pointer", marginTop: "14px" },

  noPaymentBox: { padding: "16px", background: "#f1f5f9", borderRadius: "12px", textAlign: "center", fontSize: "13px", color: "#64748b", fontWeight: "700" },
  qrBox: { display: "flex", justifyContent: "center", padding: "14px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" },
  qrImg: { width: "200px", height: "200px", objectFit: "contain" },
  bankDetailContainer: { background: "#fff", padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" },
  
  copyRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" },
  copyLabel: { margin: 0, fontSize: "11px", color: "#64748b", fontWeight: "800" },
  copyValue: { margin: "2px 0 0", fontSize: "14px", color: "#0f172a", fontWeight: "900" },
  copyBtn: { background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer" },

  noteBox: { background: "#fff5f5", color: "#c53030", padding: "12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", marginBottom: "12px", border: "1px solid #feb2b2", lineHeight: "1.4" },
  fileInput: { width: "100%", marginTop: "10px", fontSize: "13px", fontWeight: "700" }, 
  submitBtn: { width: "100%", padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "900", marginTop: "14px", cursor: "pointer" },

  paymentInstruction: {
    marginTop: "12px",
    padding: "12px",
    background: "#fff8e1",
    border: "1px solid #facc15",
    borderRadius: "10px",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: "1.5",
  }
};
