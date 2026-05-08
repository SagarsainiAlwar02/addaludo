import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Wallet() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const MIN_AMOUNT = 100;
  const MAX_AMOUNT = 100000;
  const QR_LIMIT = 2000;

  const [wallet, setWallet] = useState({
    balance: 0,
    winnings: 0,
    bonus: 0,
    referralBalance: 0,
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
  const [timeLeft, setTimeLeft] = useState(300);

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
      referralBalance: res.data.referralBalance || res.data.referBalance || 0,
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

  useEffect(() => {
    const init = async () => {
      try {
        setPageLoading(true);
        await loadWallet();
        await loadDeposits();
      } catch {
        setError("Failed to load wallet");
      } finally {
        setPageLoading(false);
      }
    };

    init();
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

  const openAddCash = () => {
    setError("");
    setAmount("");
    setUtr("");
    setScreenshot(null);
    setShowAddCash(true);
    setShowPayment(false);
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

    if (!addAmount || addAmount < MIN_AMOUNT) {
      return setError("Minimum deposit ₹100 hai");
    }

    if (addAmount > MAX_AMOUNT) {
      return setError("Maximum deposit ₹1,00,000 hai");
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

      await loadDeposits();
      await loadWallet();
    } catch (err) {
      setError(err.response?.data?.msg || "Deposit request failed");
    } finally {
      setLoading(false);
    }
  };

  const isLargePayment = Number(amount) > QR_LIMIT;

  if (pageLoading) {
    return <div style={styles.loading}>⏳ Loading Wallet...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2 style={styles.title}>Balance</h2>
          <span style={styles.online}>0 online</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div
              style={{
                ...styles.iconBox,
                background: "linear-gradient(135deg,#2563eb,#06b6d4)",
              }}
            >
              💰
            </div>
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

        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div
              style={{
                ...styles.iconBox,
                background: "linear-gradient(135deg,#7c3aed,#ec4899)",
              }}
            >
              🎁
            </div>

            <div style={styles.info}>
              <p style={styles.label}>Referral Earning</p>
              <h1 style={styles.amount}>
                ₹ {Number(wallet.referralBalance || 0).toFixed(2)}
              </h1>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button style={styles.redeemBtn} onClick={() => navigate("/redeem")}>
              Redeem 🎁
            </button>
          </div>

          <p style={styles.desc}>
            Referral earning ₹200 hone ke baad redeem karke wallet me add kar sakte ho.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div
              style={{
                ...styles.iconBox,
                background: "linear-gradient(135deg,#16a34a,#86efac)",
              }}
            >
              🏆
            </div>
            <div style={styles.info}>
              <p style={styles.label}>Winning Coin</p>
              <h1 style={styles.amount}>₹ {Number(wallet.winnings || 0).toFixed(2)}</h1>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button style={styles.withdrawBtn} onClick={() => navigate("/redeem")}>
              Withdraw 🏦
            </button>
          </div>

          <p style={styles.desc}>Withdrawable to UPI or Bank. Also usable for play.</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.historyTitle}>Deposit Requests</h3>

          {deposits.length === 0 ? (
            <p style={styles.desc}>No deposit request yet.</p>
          ) : (
            deposits.slice(0, 8).map((d) => (
              <div key={d._id} style={styles.depositItem}>
                <div>
                  <b>₹{d.amount}</b>
                  <p style={styles.small}>UTR: {d.utr}</p>
                </div>

                <span style={styles.status}>{d.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddCash && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setShowAddCash(false)}>
              ×
            </button>

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

            <div style={styles.quickRow}>
              {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
                <button key={amt} style={styles.quickBtn} onClick={() => setAmount(String(amt))}>
                  ₹{amt}
                </button>
              ))}
            </div>

            <button style={styles.payBtn} onClick={goToPayment}>
              Pay Fast
            </button>
          </div>
        </div>
      )}

      {showPayment && (
        <div style={styles.paymentPage}>
          <div style={styles.paymentCard}>
            <div style={styles.paymentHeader}>
              <button
                style={styles.paymentBack}
                onClick={() => {
                  setShowPayment(false);
                  setShowAddCash(true);
                }}
              >
                ←
              </button>

              <div style={styles.logo}>⚔️ AddaLudo</div>
              <h2 style={styles.paymentTitle}>Complete Payment</h2>
            </div>

            <div style={styles.paymentBody}>
              <div style={styles.paymentTopCard}>
                <p style={styles.scanText}>
                  {isLargePayment ? "🏦 Pay by UPI / Bank Transfer" : "▦ Scan to Pay"}
                </p>

                <h1 style={styles.bigAmount}>₹ {Number(amount || 0).toFixed(2)}</h1>

                <div style={styles.timerBox}>
                  ⏱ Time remaining: <b>{formatTime(timeLeft)}</b>
                </div>
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

              <button style={styles.cancelBtn} onClick={() => setShowPayment(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc,#eef2ff)" },
  container: { padding: "76px 14px 105px", maxWidth: "480px", margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" },
  backBtn: { width: 48, height: 48, borderRadius: 15, border: "none", background: "#fff", fontSize: 28, fontWeight: 900 },
  title: { flex: 1, margin: 0, fontSize: 30, fontWeight: 900, color: "#0f172a" },
  online: { color: "#64748b", fontSize: 15, fontWeight: 700 },
  card: { background: "#fff", borderRadius: 28, padding: 24, marginBottom: 22, boxShadow: "0 24px 60px rgba(15,23,42,.08)" },
  cardMain: { display: "flex", alignItems: "center", gap: 20 },
  iconBox: { width: 94, height: 94, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40 },
  info: { flex: 1 },
  label: { margin: "0 0 10px", color: "#64748b", fontSize: 18, fontWeight: 800 },
  amount: { margin: 0, color: "#0f172a", fontSize: 31, fontWeight: 900 },
  btnRow: { display: "flex", justifyContent: "flex-end", marginTop: 16 },
  addBtn: { border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", borderRadius: 16, padding: "14px 18px", fontSize: 19, fontWeight: 900 },
  redeemBtn: { border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", borderRadius: 16, padding: "14px 18px", fontSize: 19, fontWeight: 900 },
  withdrawBtn: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", borderRadius: 16, padding: "14px 18px", fontSize: 19, fontWeight: 900 },
  plus: { marginLeft: 10, fontSize: 24 },
  desc: { margin: "16px 0 0", color: "#64748b", fontSize: 15, lineHeight: 1.5 },
  error: { background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 14, marginBottom: 16, fontWeight: 800 },
  loading: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 },
  historyTitle: { margin: "0 0 14px", fontSize: 22, fontWeight: 900, color: "#0f172a" },
  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", padding: "12px 0" },
  small: { margin: "5px 0 0", color: "#64748b", fontSize: 13 },
  status: { padding: "7px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12, background: "#fef3c7", color: "#92400e", textTransform: "uppercase" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 9999 },
  modal: { width: "100%", maxWidth: 430, background: "#fff", borderRadius: 28, padding: 26, position: "relative" },
  closeBtn: { position: "absolute", right: 18, top: 14, border: "none", background: "#e0f2fe", width: 38, height: 38, borderRadius: "50%", fontSize: 26, fontWeight: 900 },
  modalTitle: { margin: "0 0 6px", fontSize: 30, fontWeight: 900, color: "#0f172a" },
  modalSub: { margin: "0 0 18px", color: "#64748b", fontSize: 15, fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", border: "2px solid #e2e8f0", borderRadius: 18, padding: 17, fontSize: 18, fontWeight: 800, outline: "none", marginTop: 12, background: "#fff" },
  quickRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 },
  quickBtn: { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 15, padding: 13, fontSize: 18, fontWeight: 900 },
  payBtn: { width: "100%", marginTop: 18, border: "none", borderRadius: 17, padding: 16, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontSize: 22, fontWeight: 900 },
  paymentPage: { position: "fixed", inset: 0, background: "#eef2ff", zIndex: 99999, overflowY: "auto" },
  paymentCard: { maxWidth: 720, margin: "0 auto", background: "#fff", minHeight: "100vh" },
  paymentHeader: { background: "linear-gradient(135deg,#0f172a,#1d4ed8,#7c3aed)", color: "#fff", display: "grid", gridTemplateColumns: "54px 1fr 1.4fr", alignItems: "center", padding: "14px 18px", gap: 10 },
  paymentBack: { border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 26, fontWeight: 900, borderRadius: 14, height: 42 },
  logo: { fontSize: 20, fontWeight: 900 },
  paymentTitle: { margin: 0, textAlign: "center", fontSize: 22, fontWeight: 900 },
  paymentBody: { padding: 22 },
  paymentTopCard: { background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 24, padding: 18 },
  scanText: { color: "#2563eb", fontSize: 20, fontWeight: 900, margin: "0 0 10px" },
  bigAmount: { textAlign: "center", fontSize: 40, color: "#0f172a", margin: "14px 0 18px", fontWeight: 900 },
  timerBox: { marginTop: 16, background: "#ecfeff", padding: 12, borderRadius: 16, textAlign: "center", fontSize: 16, color: "#0f172a", fontWeight: 800 },
  fileInput: { width: "100%", marginTop: 14, border: "2px dashed #93c5fd", borderRadius: 18, padding: 15, boxSizing: "border-box", background: "#f8fafc" },
  submitBtn: { width: "100%", marginTop: 18, border: "none", borderRadius: 18, padding: 17, background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: 20, fontWeight: 900 },
  cancelBtn: { width: "100%", marginTop: 10, border: "none", borderRadius: 18, padding: 15, background: "#e5e7eb", color: "#0f172a", fontSize: 18, fontWeight: 900 },
};