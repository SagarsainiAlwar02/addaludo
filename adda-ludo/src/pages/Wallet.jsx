import React, { useEffect, useState } from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_BASE = API_BASE.replace(/\/api$/, "");

export default function Wallet() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const MIN_AMOUNT = 100;
  const MAX_AMOUNT = 100000;

  const [wallet, setWallet] = useState({
    balance: 0,
    winnings: 0,
    bonus: 0,
    locked: 0,
  });

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
  
  // Custom State to track user choice inside gateway
  const [selectedMethod, setSelectedMethod] = useState(""); 

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const loadWallet = async () => {
    const res = await axios.get(`${API_BASE}/wallet`, authHeader);
    setWallet({
      balance: res.data.balance || 0,
      winnings: res.data.winnings || 0,
      bonus: res.data.bonus || 0,
      locked: res.data.locked || 0,
    });
  };

  const loadDeposits = async () => {
    try {
      const res = await axios.get(`${API_BASE}/deposit/my`, authHeader);
      setDeposits(res.data.deposits || []);
    } catch (err) {
      console.log("Deposit load error:", err.response?.data || err.message);
    }
  };

  const loadWithdraws = async () => {
    try {
      const res = await axios.get(`${API_BASE}/redeem/withdraw-history`, authHeader);
      setWithdraws(res.data.withdraws || []);
    } catch (err) {
      console.log("Withdraw load error:", err.response?.data || err.message);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/payment-settings`);
      setPayment(res.data);
    } catch (err) {
      console.log("Payment setting load error:", err.response?.data || err.message);
    }
  };

  const init = async () => {
    try {
      setPageLoading(true);
      await Promise.all([
        loadWallet(),
        loadDeposits(),
        loadWithdraws(),
        loadPaymentSettings(),
      ]);
    } catch {
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
    if (!addAmount || addAmount < MIN_AMOUNT) return setError("Minimum deposit ₹100 hai");
    if (addAmount > MAX_AMOUNT) return setError("Maximum deposit ₹1,0,000 hai");
    if (!utr.trim()) return setError("UTR / Transaction ID enter karo");
    if (!screenshot) return setError("Payment screenshot upload karo");

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("amount", addAmount);
      formData.append("utr", utr.trim());
      formData.append("screenshot", screenshot);

      const res = await axios.post(`${API_BASE}/deposit/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.msg || "Deposit request submitted");
      setShowPayment(false);
      setAmount("");
      setUtr("");
      setScreenshot(null);
      setSelectedMethod("");
      await Promise.all([loadDeposits(), loadWallet()]);
    } catch (err) {
      setError(err.response?.data?.msg || "Deposit request failed");
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
          <span style={styles.online}>online</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

       {/* --- DEPOSIT CARD (REACT FLEX INLINE) --- */}
<div style={styles.cardRectangle}>
  <div style={styles.cardMainInline}>
    
    {/* Left Part: Icon */}
    <div style={{ ...styles.iconBoxSmall, background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>💰</div>
    
    {/* Middle Part: Text & Balance */}
    <div style={styles.infoFlex}>
      <p style={styles.label}>Deposit Coin</p>
      <h1 style={styles.amountText}>₹ {Number(wallet.balance || 0).toFixed(2)}</h1>
      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#f59e0b", fontWeight: "700" }}>
        🎁 Bonus: ₹ {Number(wallet.bonus || 0).toFixed(2)}
      </p>
    </div>

    {/* Right Part: Button (Amount ke thik aage row me) */}
    <div>
      <button style={styles.addBtnInline} onClick={openAddCash}>
        Add Cash <span style={styles.plus}>+</span>
      </button>
    </div>
    
  </div>
  <p style={styles.desc}>Use to play Tournaments & Battles. Cannot be withdrawn.</p>
</div>

{/* --- WINNING CARD (REACT FLEX INLINE) --- */}
<div style={styles.cardRectangle}>
  <div style={styles.cardMainInline}>
    
    {/* Left Part: Icon */}
    <div style={{ ...styles.iconBoxSmall, background: "linear-gradient(135deg,#16a34a,#86efac)" }}>🏆</div>
    
    {/* Middle Part: Text & Balance */}
    <div style={styles.infoFlex}>
      <p style={styles.label}>Winning Coin</p>
      <h1 style={styles.amountText}>₹ {Number(wallet.winnings || 0).toFixed(2)}</h1>
    </div>

    {/* Right Part: Button (Amount ke thik aage row me) */}
    <div>
      <button style={styles.withdrawBtnInline} onClick={() => navigate("/withdraw")}>
        Withdraw 🏦
      </button>
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
            <p style={styles.modalSub}>Minimum ₹100 aur Maximum ₹1,00,000</p>
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
              <p style={styles.depositNoteLine}><b>NOTE :-</b> कृपया UTR No. सही से भरे, गलत UTR No. भरने पर Payment Add नहीं होगा, उसकी जिम्मेदारी खुद की होगी।</p>
              <p style={styles.depositNoteLine}>अगर UPI और Scanner पर Payment न हो तो Support से Contact करें।</p>
            </div>
            <button style={styles.payBtn} onClick={goToPayment}>Next Step</button>
          </div>
        </div>
      )}

      {/* MODAL 2: DYNAMIC GATEWAY PANEL */}
      {showPayment && (
        <div style={styles.paymentPage}>
          <div style={styles.paymentCard}>
            <div style={styles.paymentHeader}>
              <button style={styles.paymentBack} onClick={() => { setShowPayment(false); setShowAddCash(true); }}>←</button>
              <div style={styles.logo}>⚔️ AddaLudo</div>
              <h2 style={styles.paymentTitle}>Complete Payment</h2>
            </div>

            <div style={styles.paymentBody}>
              <div style={styles.paymentTopCard}>
                <p style={styles.scanText}>Pay ₹{numericAmount.toFixed(2)}</p>
                <div style={styles.timerBox}>⏱ Time remaining: <b>{formatTime(timeLeft)}</b></div>
              </div>

              {/* DYNAMIC RULES STRATEGY CHOICE CHANGER */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8, fontWeight: 'bold' }}>Select Payment Mode:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  
                  {/* UPI Method is always available */}
                  <button 
                    type="button" 
                    onClick={() => setSelectedMethod("upi")}
                    style={selectedMethod === "upi" ? styles.methodBtnActive : styles.methodBtn}
                  >
                    UPI ID
                  </button>

                  {/* QR SCANNER Logic (100 to 2000) */}
                  {numericAmount >= 100 && numericAmount <= 2000 && (
                    <button 
                      type="button" 
                      onClick={() => setSelectedMethod("qr")}
                      style={selectedMethod === "qr" ? styles.methodBtnActive : styles.methodBtn}
                    >
                      QR Scanner
                    </button>
                  )}

                  {/* BANK ACCOUNT DETAILS Logic (> 2000) */}
                  {numericAmount > 2000 && (
                    <button 
                      type="button" 
                      onClick={() => setSelectedMethod("bank")}
                      style={selectedMethod === "bank" ? styles.methodBtnActive : styles.methodBtn}
                    >
                      Bank Transfer
                    </button>
                  )}
                </div>
              </div>

              {/* CONDITIONAL DETAILS DISPLAY NODE */}
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
                  {bank?.name && <CopyRow label="A/C Name" value={bank.name} onCopy={copyText} />}
                  {bank?.accountNumber && <CopyRow label="A/C No." value={bank.accountNumber} onCopy={copyText} />}
                  {bank?.ifsc && <CopyRow label="IFSC" value={bank.ifsc} onCopy={copyText} />}
                </div>
              )}

              {/* UPLOAD FORM CONTROLLER */}
              {selectedMethod && (
                <div style={{ marginTop: 10 }}>
                  <div style={styles.noteBox}>
                    NOTE :- कृपया UPI और ACCOUNT details सही से भरे , गलत details भरने पर हमारी जिम्मेदारी नहीं होगी !
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
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />

                  {screenshot && <p style={styles.small}>Selected: {screenshot.name}</p>}

                  {error && <div style={{ ...styles.error, marginTop: 14 }}>{error}</div>}

                  <button style={styles.submitBtn} onClick={submitDeposit} disabled={loading}>
                    {loading ? "Submitting..." : "Submit Payment Proof"}
                  </button>
                </div>
              )}

              <button style={{ ...styles.cancelBtn, marginTop: 8 }} onClick={() => { setShowPayment(false); setSelectedMethod(""); }}>Cancel</button>
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

// 100% CORRECTED WHITE/LIGHT MODE STYLES DICTIONARY
const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc,#eef2ff)", color: "#0f172a" },
  container: { padding: "72px 14px 105px", maxWidth: "480px", margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  backBtn: { width: 42, height: 42, borderRadius: 14, border: "none", background: "#fff", fontSize: 24, fontWeight: 900, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer" },
  title: { flex: 1, margin: 0, fontSize: 27, fontWeight: 900, color: "#0f172a" },
  online: { color: "#64748b", fontSize: 13, fontWeight: 700 },
  
  // Clean Sharp Rectangle Box Layout
  cardRectangle: { background: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "16px", boxShadow: "0 10px 30px rgba(15,23,42,.05)", border: "1px solid #e2e8f0" },
  
  // Row alignment architecture matrix
  cardMainInline: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  iconBoxSmall: { width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, flexShrink: 0 },
  infoFlex: { flex: 1, minWidth: 0 },
  
  label: { margin: "0 0 2px", color: "#64748b", fontSize: 13, fontWeight: 800 },
  amountText: { margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 900 },
  
  // Right aligned button layouts
  addBtnInline: { border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  withdrawBtnInline: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  plus: { marginLeft: 3, fontSize: 15 },
  desc: { margin: "10px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.4 },
  
  error: { background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 12, marginBottom: 12, fontWeight: 800, fontSize: 13 },
  loading: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#475569" },
  
  historyCard: { background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 18px 45px rgba(15,23,42,.07)" },
  historyTabs: { display: "flex", gap: "8px", marginBottom: "12px" },
  historyTab: { flex: 1, border: "none", background: "#f1f5f9", padding: "6px 10px", borderRadius: "8px", fontWeight: 800, color: "#64748b", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" },
  activeHistoryTab: { background: "#2563eb", color: "#fff", boxShadow "0 4px 10px rgba(37,99,235,0.15)" },
  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  status: { padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 900 },
  small: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", width: "100%", maxWidth: "400px", padding: 24, borderRadius: 22, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", position: "relative", margin: "0 12px" },
  closeBtn: { position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 24, fontWeight: "bold", color: "#94a3b8", cursor: "pointer" },
  modalTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0f172a" },
  modalSub: { margin: "0 0 16px", color: "#64748b", fontSize: 13, fontWeight: 600 },
  input: { width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 14, border: "1px solid #cbd5e1", fontSize: 15, fontWeight: 700, outline: "none", marginBottom: 14, color: "#0f172a" },
  fileInput: { width: "100%", boxSizing: "border-box", fontSize: 13, color: "#64748b", marginBottom: 14 },
  depositNoteBox: { background: "#fffbeb", border: "1px solid #fde68a", padding: 12, borderRadius: 14, marginBottom: 14 },
  depositNoteLine: { margin: "0 0 4px", fontSize: 12, color: "#b45309", lineHeight: 1.4, fontWeight: 600 },
  payBtn: { width: "100%", border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", padding: 14, borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: "pointer" },

  paymentPage: { position: "fixed", inset: 0, background: "linear-gradient(135deg,#f8fafc,#eef2ff)", overflowY: "auto", zIndex: 200, padding: "24px 12px" },
  paymentCard: { maxWidth: "440px", margin: "0 auto", background: "#fff", borderRadius: 24, padding: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" },
  paymentHeader: { display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 14 },
  paymentBack: { background: "none", border: "none", fontSize: 22, fontWeight: 900, cursor: "pointer", color: "#0f172a" },
  logo: { flex: 1, fontWeight: 900, color: "#2563eb", fontSize: 20 },
  paymentTitle: { fontSize: 14, margin: 0, color: "#64748b", fontWeight: 800 },
  paymentBody: { display: "flex", flexDirection: "column" },
  paymentTopCard: { background: "#f8fafc", borderRadius: 16, padding: 16, textAlign: "center", marginBottom: 14, border: "1px solid #e2e8f0" },
  scanText: { margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#0f172a" },
  timerBox: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  noPaymentBox: { padding: 14, textAlign: "center", color: "#b91c1c", background: "#fef2f2", borderRadius: 12, fontSize: 13, fontWeight: 700 },
  qrBox: { display: "flex", justifyContent: "center", background: "#fff", padding: 10, borderRadius: 16, border: "1px solid #e2e8f0", maxWidth: "180px", margin: "0 auto 14px" },
  qrImg: { width: "100%", height: "auto" },
  noteBox: { padding: 12, fontSize: 12, background: "#fff1f2", color: "#be123c", borderRadius: 12, marginBottom: 14, fontWeight: 600, border: "1px solid #ffe4e6", lineHeight: 1.45 },
  submitBtn: { width: "100%", border: "none", background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", padding: 14, borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: "pointer" },
  cancelBtn: { width: "100%", border: "none", background: "#f1f5f9", color: "#64748b", padding: 12, borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer" },

  methodBtn: { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: "800", cursor: "pointer" },
  methodBtnActive: { background: "linear-gradient(135deg,#2563eb,#06b6d4)", border: "none", color: "#fff", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" },

  bankDetailContainer: { background: "#f8fafc", padding: "6px 10px", borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 12 },
  copyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: 14, marginBottom: 10, border: "1px solid #e2e8f0" },
  copyLabel: { margin: 0, fontSize: 12, color: "#64748b", fontWeight: 700 },
  copyValue: { margin: "2px 0 0", fontSize: 14, color: "#0f172a", fontWeight: "900" },
  copyBtn: { background: "#e2e8f0", border: "none", color: "#2563eb", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: "pointer" }
};
