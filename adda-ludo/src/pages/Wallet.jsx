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
    if (!addAmount || addAmount < MIN_AMOUNT) return setError("Minimum deposit ₹100 hai");
    if (addAmount > MAX_AMOUNT) return setError("Maximum deposit ₹1,0,0,000 hai");
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
              <h2 style={styles.paymentTitle}>Complete Payment</h2>
            </div>

            <div style={styles.paymentBody}>
              <div style={styles.paymentTopCard}>
                <p style={styles.scanText}>Pay ₹{numericAmount.toFixed(2)}</p>
                <div style={styles.timerBox}>⏱ Time remaining: <b>{formatTime(timeLeft)}</b></div>
              </div>

              {/* DYNAMIC SELECTION MODES WITH COLOR ACTIVE LOOK */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10, fontWeight: 'bold' }}>Select Payment Mode:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  
                  {/* UPI Gateway */}
                  <button 
                    type="button" 
                    onClick={() => setSelectedMethod("upi")}
                    style={selectedMethod === "upi" ? styles.methodBtnActive : styles.methodBtn}
                  >
                    UPI ID
                  </button>

                  {/* QR SCANNER (100 to 2000) */}
                  {numericAmount >= 100 && numericAmount <= 2000 && (
                    <button 
                      type="button" 
                      onClick={() => setSelectedMethod("qr")}
                      style={selectedMethod === "qr" ? styles.methodBtnActive : styles.methodBtn}
                    >
                      QR Scanner
                    </button>
                  )}

                  {/* BANK DETAILS (> 2000) */}
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

              {/* PROOF UPLOADER FLOW */}
              {selectedMethod && (
                <div style={{ marginTop: 15 }}>
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

// 100% CORRECTED TRUE DARK-WHITE WEBSITE RENDERING DICTIONARY
const styles = {
  page
