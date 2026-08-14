import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";
import DepositFlow from "../components/DepositFlow.jsx";

export default function Wallet() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState({
    balance: 0,
    winnings: 0,
    bonus: 0,
    locked: 0,
  });

  // KYC State Added
  const [kycStatus, setKycStatus] = useState("not_submitted");

  const [showAddCash, setShowAddCash] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [deposits, setDeposits] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [payment, setPayment] = useState(null);
  const [activeHistory, setActiveHistory] = useState("deposit");

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

  const getStatusStyle = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "success" || s === "approved") return { background: "#dcfce7", color: "#166534" };
    if (s === "rejected" || s === "failed") return { background: "#fee2e2", color: "#991b1b" };
    return { background: "#fef3c7", color: "#92400e" };
  };

  const openAddCash = () => {
    setError("");
    setShowAddCash(true);
    loadPaymentSettings();
  };

  // Refresh deposit history + wallet after a successful deposit request
  const handleDepositSuccess = async () => {
    await Promise.all([loadDeposits(), loadWallet()]);
  };

  if (pageLoading) {
    return <div style={styles.loading}>⏳ Loading Wallet...</div>;
  }

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

      {/* NEW DEPOSIT FLOW (addafun design) — opened via "Add Cash +" */}
      {showAddCash && (
        <DepositFlow
          payment={payment}
          onClose={() => setShowAddCash(false)}
          onSuccess={handleDepositSuccess}
        />
      )}
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
  container: { padding: "68px 10px 96px", maxWidth: "420px", margin: "0 auto", width: "100%", boxSizing: "border-box" },
  headerRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" },
  backBtn: { width: 38, height: 38, borderRadius: 12, border: "none", background: "#fff", fontSize: 22, fontWeight: 900, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer" },
  title: { flex: 1, margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" },
  online: { color: "#64748b", fontSize: 12, fontWeight: 700 },

  cardRectangle: { background: "#fff", borderRadius: "12px", padding: "14px", marginBottom: "14px", boxShadow: "0 10px 30px rgba(15,23,42,.03)", border: "1px solid #e2e8f0" },
  cardMainInline: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  iconBoxSmall: { width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, flexShrink: 0 },
  infoFlex: { flex: 1, minWidth: 0 },

  label: { margin: "0 0 2px", color: "#64748b", fontSize: 12, fontWeight: 800 },
  amountText: { margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 },

  addBtnInline: { border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  withdrawBtnInline: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },

  // Dynamic Complete KYC Button Styling
  completeKycBtnInline: { border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderRadius: 10, padding: "9px 10px", fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 10px rgba(217,119,6,0.2)" },

  plus: { marginLeft: 3, fontSize: 14 },
  desc: { margin: "10px 0 0", color: "#64748b", fontSize: 11.5, lineHeight: 1.4 },
  loading: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#475569" },

  historyCard: { background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 18px 45px rgba(15,23,42,.07)", border: "1px solid #e2e8f0" },
  historyTabs: { display: "flex", gap: "8px", marginBottom: "12px" },
  historyTab: { flex: 1, border: "none", background: "#f1f5f9", padding: "6px 10px", borderRadius: 8, fontWeight: 800, color: "#64748b", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" },
  activeHistoryTab: { background: "#2563eb", color: "#fff", boxShadow: "0 4px 10px rgba(37,99,235,0.15)" },
  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  status: { padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 900 },
  small: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" },
};
