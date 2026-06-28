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

        {/* --- WINNING CARD --- */}
        <div style={styles.cardRectangle}>
          <div style={styles.cardMainInline}>
            <div style={{ ...styles.iconBoxSmall, background: "linear-gradient(135deg,#16a34a,#86efac)" }}>🏆</div>
            <div style={styles.infoFlex}>
              <p style={styles.label}>Winning Coin</p>
              <h1 style={styles.amountText}>₹ {Number(wallet.winnings || 0).toFixed(2)}</h1>
            </div>
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
              <p style={styles.depositNoteLine}><b>NOTE :-</b>Please Enter UTR no Correctly.</p>
              <p style={styles.depositNoteLine}>Sahi se UTR enter kare Galt UTR fill karne par Payment add nhi hoga</p>
            </div>
            <button style={styles.payBtn} onClick={goToPayment}>Next </button>
          </div>
        </div>
      )}

      {/* MODAL 2: DYNAMIC GATEWAY PANEL (100% RECOLORED MATCHING HEADERS & CARDS) */}
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
