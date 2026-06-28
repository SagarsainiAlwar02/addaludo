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
    } final {
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
    if (s === "success" || s === "approved") return { background: "#14532d", color: "#4ade80" };
    if (s === "rejected" || s === "failed") return { background: "#7f1d1d", color: "#f87171" };
    return { background: "#78350f", color: "#fbbf24" };
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
    if (addAmount > MAX_AMOUNT) return setError("Maximum add cash amount is ₹1,00,000");

    setError("");
    setShowAddCash(false);
    setShowPayment(true);
  };

  const submitDeposit = async () => {
    const addAmount = Number(amount);
    if (!addAmount || addAmount < MIN_AMOUNT) return setError("Minimum deposit ₹100 hai");
    if (addAmount > MAX_AMOUNT) return setError("Maximum deposit ₹1,00,000 hai");
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
          <span style={styles.online}>Adda Ludo Portal</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Deposit Card */}
        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#1e3a8a,#0284c7)" }}>💰</div>
            <div style={styles.info}>
              <p style={styles.label}>Deposit Coin</p>
              <h1 style={styles.amount}>₹ {Number(wallet.balance || 0).toFixed(2)}</h1>
            </div>
          </div>
          <div style={styles.btnRow}>
            <button style={styles.addBtn} onClick={openAddCash}>Add Cash <span style={styles.plus}>+</span></button>
          </div>
          <p style={styles.desc}>Use to play Tournaments & Battles. Cannot be withdrawn.</p>
        </div>

        {/* Bonus Card */}
        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#78350f,#d97706)" }}>🎁</div>
            <div style={styles.info}>
              <p style={styles.label}>Bonus Coin</p>
              <h1 style={styles.amount}>₹ {Number(wallet.bonus || 0).toFixed(2)}</h1>
            </div>
          </div>
          <p style={styles.desc}>Bonus coins can be used to play battles only.</p>
        </div>

        {/* Winning Card */}
        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#064e3b,#059669)" }}>🏆</div>
            <div style={styles.info}>
              <p style={styles.label}>Winning Coin</p>
              <h1 style={styles.amount}>₹ {Number(wallet.winnings || 0).toFixed(2)}</h1>
            </div>
          </div>
          <div style={styles.btnRow}>
            <button style={styles.withdrawBtn} onClick={() => navigate("/withdraw")}>Withdraw 🏦</button>
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
            <p style={styles.modalSub}>Minimum ₹100 और Maximum ₹1,0,000</p>
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
              <p style={styles.depositNoteLine}><b>NOTE :-</b> Kripya details dhyan se padhein.</p>
              <p style={styles.depositNoteLine}>Sahi se UTR enter karein taaki transactions turant approve ho sakein.</p>
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
              <h2 style={styles.paymentTitle}>Secure Gateway</h2>
            </div>

            <div style={styles.paymentBody}>
              <div style={styles.paymentTopCard}>
                <p style={styles.scanText}>Amount to Pay: ₹{numericAmount.toFixed(2)}</p>
                <div style={styles.timerBox}>⏱ Remaining Time: <b>{formatTime(timeLeft)}</b></div>
              </div>

              {/* DYNAMIC RULES STRATEGY CHOICE CHANGER */}
              <div style={{ marginBottom: 15 }}>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8, fontWeight: 'bold' }}>Choose Payment Mode:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  
                  {/* UPI Method is always available */}
                  <button 
                    type="button" 
                    onClick={() => setSelectedMethod("upi")}
                    style={selectedMethod === "upi" ? styles.methodBtnActive : styles.methodBtn}
                  >
                    UPI Gateway
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
                      Bank Details
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
                  {bank?.name && <CopyRow label="Bank Name" value={bank.name} onCopy={copyText} />}
                  {bank?.accountNumber && <CopyRow label="Account Number" value={bank.accountNumber} onCopy={copyText} />}
                  {bank?.ifsc && <CopyRow label="IFSC Code" value={bank.ifsc} onCopy={copyText} />}
                </div>
              )}

              {/* UPLOAD FORM CONTROLLER */}
              {selectedMethod && (
                <div style={{ marginTop: 20 }}>
                  <div style={styles.noteBox}>
                    ⚠️ NOTE :- Galat details / fake proof upload karne par account block kar diya jayega!
                  </div>

                  <input
                    type="text"
                    value={utr}
                    placeholder="Enter 12-Digit UTR / Ref No."
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                    style={styles.input}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />

                  {screenshot && <p style={styles.small}>Attached Proof: {screenshot.name}</p>}

                  <button style={styles.submitBtn} onClick={submitDeposit} disabled={loading}>
                    {loading ? "Verifying Transaction..." : "Submit Details"}
                  </button>
                </div>
              )}

              <button style={styles.cancelBtn} onClick={() => { setShowPayment(false); setSelectedMethod(""); }}>Cancel</button>
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
              <b style={{ color: "#fff" }}>₹{item.amount}</b>
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

// PREMIUM DARK MODE CSS OBJECT MATRIX
const styles = {
  page: { minHeight: "100vh", background: "#090d16", color: "#f8fafc" },
  container: { padding: "30px 14px 105px", maxWidth: "480px", margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  backBtn: { width: 42, height: 42, borderRadius: 14, border: "none", background: "#1e293b", fontSize: 20, color: "#fff", cursor: "pointer" },
  title: { flex: 1, margin: 0, fontSize: 24, fontWeight: 900, color: "#f59e0b" },
  online: { color: "#64748b", fontSize: 13, fontWeight: 700 },
  card: { background: "#111827", borderRadius: 22, padding: 18, marginBottom: 16, border: "1px solid #1f2937" },
  cardMain: { display: "flex", alignItems: "center", gap: 15 },
  iconBox: { width: 60, height: 60, borderRadius: 16, display: "flex", alignItems: "center", justify: "center", fontSize: 26 },
  info: { flex: 1 },
  label: { margin: "0 0 4px", color: "#94a3b8", fontSize: 14, fontWeight: 700 },
  amount: { margin: 0, color: "#fff", fontSize: 24, fontWeight: 900 },
  btnRow: { display: "flex", justifyContent: "flex-end", marginTop: 12 },
  addBtn: { border: "none", background: "linear-gradient(135deg,#eab308,#ca8a04)", color: "#000", borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 900, cursor: "pointer" },
  withdrawBtn: { border: "1px solid #065f46", background: "#042f2e", color: "#34d399", borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 900, cursor: "pointer" },
  plus: { marginLeft: 5, fontSize: 16 },
  desc: { margin: "12px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.45 },
  error: { background: "#7f1d1d", color: "#fca5a5", padding: 12, borderRadius: 12, marginBottom: 12, fontWeight: 700, fontSize: 13, border: "1px solid #f87171" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#090d16", color: "#f59e0b", fontSize: 18, fontWeight: "bold" },
  
  // Tabs History Styles
  historyCard: { background: "#111827", borderRadius: 22, padding: 16, border: "1px solid #1f2937" },
  historyTabs: { display: "flex", gap: 10, marginBottom: 15 },
  historyTab: { flex: 1, background: "#1f2937", border: "none", color: "#94a3b8", padding: "10px 5px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  activeHistoryTab: { background: "#eab308", color: "#000" },
  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1f2937" },
  status: { padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, uppercase: "true" },
  small: { fontSize: 11, color: "#64748b", margin: "2px 0 0" },

  // Modals Core Architecture Layout
  modalOverlay: { fixed: "position", inset: 0, position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#111827", w: "100%", maxWidth: "400px", padding: 24, borderRadius: 24, border: "1px solid #374151", position: "relative", margin: "0 10px" },
  closeBtn: { position: "absolute", top: 12, right: 16, background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" },
  modalTitle: { margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#
