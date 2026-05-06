import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function Wallet() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const MIN_AMOUNT = 100;
  const MAX_AMOUNT = 100000;

  const [wallet, setWallet] = useState({
    balance: 0,
    winnings: 0,
    bonus: 0,
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
    const res = await axios.get(`${API_BASE}/api/wallet`, authHeader);
    setWallet({
      balance: res.data.balance || 0,
      winnings: res.data.winnings || 0,
      bonus: res.data.bonus || 0,
    });
  };

  const loadDeposits = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/deposit/my`, authHeader);
      setDeposits(res.data.deposits || []);
    } catch (err) {
      console.log(err);
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
    // eslint-disable-next-line
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

    if (!utr.trim()) return setError("UTR / Transaction ID enter karo");
    if (!screenshot) return setError("Payment screenshot upload karo");

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("amount", addAmount);
      formData.append("utr", utr.trim());
      formData.append("screenshot", screenshot);

      const res = await axios.post(`${API_BASE}/api/deposit/create`, formData, {
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

  if (pageLoading) {
    return <div style={styles.loading}>⏳ Loading Wallet...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
          <h2 style={styles.title}>Balance</h2>
          <span style={styles.online}>0 online</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.card}>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>
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
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#16a34a,#86efac)" }}>
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

                <span
                  style={{
                    ...styles.status,
                    background:
                      d.status === "approved"
                        ? "#dcfce7"
                        : d.status === "rejected"
                        ? "#fee2e2"
                        : "#fef3c7",
                    color:
                      d.status === "approved"
                        ? "#166534"
                        : d.status === "rejected"
                        ? "#991b1b"
                        : "#92400e",
                  }}
                >
                  {d.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

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

            <div style={styles.quickRow}>
              {[100, 500, 1000, 4980].map((amt) => (
                <button key={amt} style={styles.quickBtn} onClick={() => setAmount(String(amt))}>
                  ₹{amt}
                </button>
              ))}
            </div>

            <button style={styles.payBtn} onClick={goToPayment}>Pay Fast</button>

            <div style={styles.warning}>
              💡 कृपया कोई भी धोखाधड़ी वाला भुगतान न करवाएँ। ऐसा करने पर आपका अकाउंट ब्लॉक कर दिया जाएगा।
            </div>
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
                <p style={styles.scanText}>▦ Scan to Pay</p>

                <h1 style={styles.bigAmount}>
                  <span style={{ fontSize: 24 }}>₹</span> {Number(amount || 0).toFixed(2)}
                </h1>

                <div style={styles.qrBox}>
                  <div style={styles.fakeQr}>
                    <div style={styles.qrInner}>
                      <div style={styles.qrIcon}>▦</div>
                      <div>UPI QR</div>
                      <small>Replace with your QR image</small>
                    </div>
                  </div>
                </div>

                <div style={styles.timerBox}>
                  ⏱ Time remaining: <b>{formatTime(timeLeft)}</b>
                </div>
              </div>

              <div style={styles.steps}>
                <p><b>1</b> Open your UPI payment app</p>
                <p><b>2</b> Tap on Scan QR Code</p>
                <p><b>3</b> Pay exact ₹{amount}</p>
                <p><b>4</b> Enter UTR and upload screenshot</p>
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
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#f8fafc,#eef2ff)",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    padding: "16px 14px 105px",
    maxWidth: "480px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "24px",
  },
  backBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "15px",
    border: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "900",
    boxShadow: "0 10px 24px rgba(15,23,42,.08)",
  },
  title: {
    flex: 1,
    margin: 0,
    fontSize: "30px",
    fontWeight: "900",
    color: "#0f172a",
  },
  online: {
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "700",
  },
  card: {
    background: "rgba(255,255,255,.92)",
    borderRadius: "28px",
    padding: "24px",
    marginBottom: "22px",
    boxShadow: "0 24px 60px rgba(15,23,42,.08)",
    border: "1px solid rgba(255,255,255,.7)",
  },
  cardMain: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  iconBox: {
    width: "94px",
    height: "94px",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "40px",
    boxShadow: "0 18px 35px rgba(37,99,235,.22)",
  },
  info: { flex: 1 },
  label: {
    margin: "0 0 10px",
    color: "#64748b",
    fontSize: "18px",
    fontWeight: "800",
  },
  amount: {
    margin: 0,
    color: "#0f172a",
    fontSize: "31px",
    fontWeight: "900",
  },
  btnRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  addBtn: {
    border: "none",
    background: "linear-gradient(135deg,#2563eb,#06b6d4)",
    color: "#ffffff",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "19px",
    fontWeight: "900",
    boxShadow: "0 12px 26px rgba(37,99,235,.28)",
  },
  withdrawBtn: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "19px",
    fontWeight: "900",
  },
  plus: { marginLeft: "10px", fontSize: "24px" },
  desc: {
    margin: "16px 0 0",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "14px",
    marginBottom: "16px",
    fontWeight: "800",
  },
  loading: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    color: "#0f172a",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
    backdropFilter: "blur(8px)",
  },
  modal: {
    width: "100%",
    maxWidth: "430px",
    background: "linear-gradient(135deg,#ffffff,#eff6ff)",
    borderRadius: "28px",
    padding: "26px",
    position: "relative",
    boxShadow: "0 30px 90px rgba(0,0,0,.30)",
  },
  closeBtn: {
    position: "absolute",
    right: "18px",
    top: "14px",
    border: "none",
    background: "#e0f2fe",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    fontSize: "26px",
    fontWeight: "900",
  },
  modalTitle: {
    margin: "0 0 6px",
    fontSize: "30px",
    fontWeight: "900",
    color: "#0f172a",
  },
  modalSub: {
    margin: "0 0 18px",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "700",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "2px solid #e2e8f0",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "18px",
    fontWeight: "800",
    outline: "none",
    marginTop: "12px",
    background: "#ffffff",
  },
  quickRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px",
  },
  quickBtn: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "15px",
    padding: "13px",
    fontSize: "18px",
    fontWeight: "900",
  },
  payBtn: {
    width: "100%",
    marginTop: "18px",
    border: "none",
    borderRadius: "17px",
    padding: "16px",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "900",
    boxShadow: "0 16px 35px rgba(79,70,229,.30)",
  },
  warning: {
    marginTop: "18px",
    background: "#fff7ed",
    color: "#9a3412",
    padding: "15px",
    borderRadius: "17px",
    fontWeight: "800",
    lineHeight: 1.5,
  },
  historyTitle: {
    margin: "0 0 14px",
    fontSize: "22px",
    fontWeight: "900",
    color: "#0f172a",
  },
  depositItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 0",
  },
  small: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  status: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    textTransform: "uppercase",
  },
  paymentPage: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(circle at top,#dbeafe,#eef2ff 45%,#f8fafc)",
    zIndex: 99999,
    overflowY: "auto",
  },
  paymentCard: {
    maxWidth: "720px",
    margin: "0 auto",
    background: "#ffffff",
    minHeight: "100vh",
    boxShadow: "0 0 80px rgba(37,99,235,.18)",
  },
 paymentHeader: {
  background: "linear-gradient(135deg,#0f172a,#1d4ed8,#7c3aed)",
  color: "#ffffff",
  display: "grid",
  gridTemplateColumns: "54px 1fr 1.4fr",
  alignItems: "center",
  padding: "14px 18px",
  gap: "10px",
},

paymentBack: {
  border: "none",
  background: "rgba(255,255,255,.12)",
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "900",
  borderRadius: "14px",
  height: "42px",
},

logo: {
  fontSize: "20px",
  fontWeight: "900",
},

paymentTitle: {
  margin: 0,
  textAlign: "center",
  fontSize: "22px",
  fontWeight: "900",
  color: "#ffffff",
},

paymentBody: {
  padding: "22px",
},

paymentTopCard: {
  background: "linear-gradient(135deg,#ffffff,#eff6ff)",
  border: "1px solid #dbeafe",
  borderRadius: "24px",
  padding: "18px",
  boxShadow: "0 18px 45px rgba(37,99,235,.10)",
},

scanText: {
  color: "#2563eb",
  fontSize: "20px",
  fontWeight: "900",
  margin: "0 0 10px",
},

bigAmount: {
  textAlign: "center",
  fontSize: "40px",
  color: "#0f172a",
  margin: "14px 0 18px",
  fontWeight: "900",
},

fakeQr: {
  width: "210px",
  height: "210px",
  border: "3px solid #2563eb",
  borderRadius: "22px",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  color: "#0f172a",
  background: "linear-gradient(135deg,#ffffff,#dbeafe)",
  boxShadow: "0 16px 35px rgba(37,99,235,.18)",
},

qrInner: {
  width: "160px",
  height: "160px",
  borderRadius: "18px",
  display: "grid",
  placeItems: "center",
  background:
    "repeating-linear-gradient(45deg,#0f172a 0 7px,#ffffff 7px 14px)",
  color: "#ffffff",
  textShadow: "0 2px 8px rgba(0,0,0,.6)",
  fontSize: "20px",
  fontWeight: "900",
  padding: "8px",
},

qrIcon: {
  fontSize: "26px",
},

timerBox: {
  marginTop: "16px",
  background: "linear-gradient(135deg,#ecfeff,#eff6ff)",
  padding: "12px",
  borderRadius: "16px",
  textAlign: "center",
  fontSize: "16px",
  color: "#0f172a",
  border: "1px solid #bfdbfe",
  fontWeight: "800",
},

steps: {
  marginTop: "18px",
  color: "#334155",
  fontSize: "16px",
  lineHeight: 1.7,

  },
  fileInput: {
    width: "100%",
    marginTop: "14px",
    border: "2px dashed #93c5fd",
    borderRadius: "18px",
    padding: "15px",
    boxSizing: "border-box",
    background: "#f8fafc",
  },
  submitBtn: {
    width: "100%",
    marginTop: "18px",
    border: "none",
    borderRadius: "18px",
    padding: "17px",
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "900",
    boxShadow: "0 16px 35px rgba(34,197,94,.28)",
  },
  cancelBtn: {
    width: "100%",
    marginTop: "10px",
    border: "none",
    borderRadius: "18px",
    padding: "15px",
    background: "#e5e7eb",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: "900",
  },
};