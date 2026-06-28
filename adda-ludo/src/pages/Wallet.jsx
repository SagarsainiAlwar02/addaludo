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

  // Custom choice track karne ke liye state aapke original design me add ki hai
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
      const res = await axios.get(
        `${API_BASE}/redeem/withdraw-history`,
        authHeader
      );
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
    if (s === "success" || s === "approved") {
      return { background: "#dcfce7", color: "#166534" };
    }
    if (s === "rejected" || s === "failed") {
      return { background: "#fee2e2", color: "#991b1b" };
    }
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
    if (addAmount > MAX_AMOUNT)
      return setError("Maximum add cash amount is ₹1,00,000");

    setError("");
    setShowAddCash(false);
    setShowPayment(true);
  };

  const submitDeposit = async () => {
    const addAmount = Number(amount);
    if (!addAmount || addAmount < MIN_AMOUNT) {
      return setError("Minimum deposit ₹100 hai");
    }
    if (addAmount > MAX_AMOUNT) {
      return setError("Maximum deposit ₹1,0,000 hai");
    }
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
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
          <h2 style={styles.title}>Balance</h2>
          <span style={styles.online}>0 online</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Deposit Card */}
        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>💰</div>
            <div style={styles.info}>
              <p style={styles.label}>Deposit Coin</p>
              <h1 style={styles.amount}>₹ {Number(wallet.balance || 0).toFixed(2)}</h1>
            </div>
          </div>
          <div style={styles.btnRow}>
            <button style={styles.addBtn} onClick={openAddCash}>
              Add Cash <span style={styles.plus}>+</span>
            </button>
          </div>
          <p style={styles.desc}>Use to play Tournaments & Battles. Cannot be withdrawn.</p>
        </div>

        {/* Bonus Card */}
        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#f59e0b,#fcd34d)" }}>🎁</div>
            <div style={styles.info}>
              <p style={styles.label}>Bonus Coin</p>
              <h1 style={styles.amount}>₹ {Number(wallet.bonus || 0).toFixed(2)}</h1>
            </div>
          </div>
          <p style={styles.desc}>Bonus coins can be used to play battles only.</p>
        </div>

        {/* Winnings Card */}
        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#16a34a,#86efac)" }}>🏆</div>
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

        {/* History Box */}
        <div style={styles.historyCard}>
          <div style={styles.historyTabs}>
            <button
              onClick={() => setActiveHistory("deposit")}
              style={{ ...styles.historyTab, ...(activeHistory === "deposit" ? styles.activeHistoryTab : {}) }}
            >
              Deposit History
            </button>
            <button
              onClick={() => setActiveHistory("withdraw")}
              style={{ ...styles.historyTab, ...(activeHistory === "withdraw" ? styles.activeHistoryTab : {}) }}
            >
              Withdraw History
            </button>
          </div>
          <HistoryBox
            empty={activeHistory === "deposit" ? "No deposit request yet." : "No withdraw request yet."}
            items={activeHistory === "deposit" ? deposits : withdraws}
            getStatusStyle={getStatusStyle}
            type={activeHistory === "deposit" ? "deposit" : "withdraw"}
          />
        </div>
      </div>

      {/* MODAL 1: ADD MONEY */}
      {showAddCash && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setShowAddCash(false)}>×</button>
            <h2 style={styles.modalTitle}>Add Money</h2>
            <p style={styles.modalSub}>Minimum ₹100 और Maximum ₹1,00,000</p>
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
            <button style={styles.payBtn} onClick={goToPayment}>Pay Fast</button>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLETE PAYMENT (AAPKI EXACT REQUIREMENT ADDED HERE) */}
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

              {/* DYNAMIC SELECTION TABS ACCORDING TO AMOUNT RANGE */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8, fontWeight: "bold" }}>Select Payment Mode:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  
                  {/* UPI Button (Always Available) */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("upi")}
                    style={selectedMethod === "upi" ? styles.methodBtnActive : styles.methodBtn}
                  >
                    UPI ID
                  </button>

                  {/* QR SCANNER (Only if 100 to 2000) */}
                  {numericAmount >= 100 && numericAmount <= 2000 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("qr")}
                      style={selectedMethod === "qr" ? styles.methodBtnActive : styles.methodBtn}
                    >
                      QR Scanner
                    </button>
                  )}

                  {/* BANK ACCOUNT DETAILS (Only if > 2000) */}
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

              {/* DYNAMIC CONTENT DISPLAYERSTRUCTS */}
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
                <div style={{ background: "#f8fafc", padding: "6px 10px", borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 12 }}>
                  {bank?.name && <CopyRow label="A/C Name" value={bank.name} onCopy={copyText} />}
                  {bank?.accountNumber && <CopyRow label="A/C No." value={bank.accountNumber} onCopy={copyText} />}
                  {bank?.ifsc && <CopyRow label="IFSC" value={bank.ifsc} onCopy={copyText} />}
                </div>
              )}

              {/* PROOF SUBMISSION FORM CONTENT */}
              {selectedMethod && (
                <div style={{ marginTop: 10 }}>
                  <div style={styles.noteBox}>
                    NOTE :- कृपया UPI और ACCOUNT details सही से भरे , गलत details भरने पर हमारी जिम्मेदार नहीं होगी !
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

              <button style={{ ...styles.cancelBtn, marginTop: 8 }} onClick={() => { setShowPayment(false); setSelectedMethod(""); }}>
                Cancel
              </button>
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
              <b>₹{item.amount}</b>
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

// AAPKA APNA EXACT STYLING DICTIONARY (ORIGINAL WHITE/LIGHT INTERFACE)
const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc,#eef2ff)" },
  container: { padding: "72px 14px 105px", maxWidth: "480px", margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  backBtn: { width: 42, height: 42, borderRadius: 14, border: "none", background: "#fff", fontSize: 24, fontWeight: 900, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  title: { flex: 1, margin: 0, fontSize: 27, fontWeight: 900, color: "#0f172a" },
  online: { color: "#64748b", fontSize: 13, fontWeight: 700 },
  card: { background: "#fff", borderRadius: 22, padding: 18, marginBottom: 16, boxShadow: "0 18px 45px rgba(15,23,42,.07)" },
  cardMain: { display: "flex", alignItems: "center", gap: 15 },
  iconBox: { width: 70, height: 70, borderRadius: 20, display: "flex", alignItems: "center", justify: "center", color: "#fff", fontSize: 32 },
  info: { flex: 1 },
  label: { margin: "0 0 6px", color: "#64748b", fontSize: 15, fontWeight: 800 },
  amount: { margin: 0, color: "#0f172a", fontSize: 27, fontWeight: 900 },
  btnRow: { display: "flex", justifyContent: "flex-end", marginTop: 12 },
  addBtn: { border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", borderRadius: 14, padding: "11px 15px", fontSize: 16, fontWeight: 900, cursor: "pointer" },
  withdrawBtn: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", borderRadius: 14, padding: "11px 15px", fontSize: 16, fontWeight: 900, cursor: "pointer" },
  plus: { marginLeft: 7, fontSize: 20 },
  desc: { margin: "12px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.45 },
  error: { background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 12, marginBottom: 12, fontWeight: 800, fontSize: 13 },
  loading: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#475569" },
  
  historyCard: { background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 18px 45px rgba(15,23,42,.07)" },
  historyTabs: { display: "flex", gap: "10px", marginBottom: "14px" },
  historyTab: { flex: 1, border: "none", background: "#f1f5f9", padding: "10px", borderRadius: 12, fontWeight: 800, color: "#64748b", cursor: "pointer" },
  activeHistoryTab: { background: "#2563eb", color: "#fff" },
  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  status: { padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 900 },
  small: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" },

  modalOverlay: { fixed: "position", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.3)"
