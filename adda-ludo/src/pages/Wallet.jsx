// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// const SERVER_BASE = API_BASE.replace(/\/api$/, "");

// export default function Wallet() {
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");

//   const MIN_AMOUNT = 100;
//   const MAX_AMOUNT = 100000;

//   const [wallet, setWallet] = useState({
//     balance: 0,
//     winnings: 0,
//     bonus: 0,
//     locked: 0,
//   });

//   const [amount, setAmount] = useState("");
//   const [utr, setUtr] = useState("");
//   const [screenshot, setScreenshot] = useState(null);

//   const [showAddCash, setShowAddCash] = useState(false);
//   const [showPayment, setShowPayment] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const [pageLoading, setPageLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [deposits, setDeposits] = useState([]);
//   const [withdraws, setWithdraws] = useState([]);
//   const [payment, setPayment] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(300);
//   const [activeHistory, setActiveHistory] = useState("deposit");

//   const authHeader = {
//     headers: { Authorization: `Bearer ${token}` },
//   };

//   useEffect(() => {
//     if (!token) navigate("/login");
//   }, [token, navigate]);

//   const loadWallet = async () => {
//     const res = await axios.get(`${API_BASE}/wallet`, authHeader);

//     setWallet({
//       balance: res.data.balance || 0,
//       winnings: res.data.winnings || 0,
//       bonus: res.data.bonus || 0,
//       locked: res.data.locked || 0,
//     });
//   };

//   const loadDeposits = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/deposit/my`, authHeader);
//       setDeposits(res.data.deposits || []);
//     } catch (err) {
//       console.log("Deposit load error:", err.response?.data || err.message);
//     }
//   };

//   const loadWithdraws = async () => {
//     try {
//       const res = await axios.get(
//         `${API_BASE}/redeem/withdraw-history`,
//         authHeader
//       );
//       setWithdraws(res.data.withdraws || []);
//     } catch (err) {
//       console.log("Withdraw load error:", err.response?.data || err.message);
//     }
//   };

//   const loadPaymentSettings = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/admin/payment-settings`);
//       setPayment(res.data);
//     } catch (err) {
//       console.log("Payment setting load error:", err.response?.data || err.message);
//     }
//   };

//   const init = async () => {
//     try {
//       setPageLoading(true);
//       await Promise.all([
//         loadWallet(),
//         loadDeposits(),
//         loadWithdraws(),
//         loadPaymentSettings(),
//       ]);
//     } catch {
//       setError("Failed to load wallet");
//     } finally {
//       setPageLoading(false);
//     }
//   };

//   useEffect(() => {
//     init();

//     const refreshWallet = () => init();
//     window.addEventListener("walletUpdated", refreshWallet);

//     return () => window.removeEventListener("walletUpdated", refreshWallet);
//     // eslint-disable-next-line
//   }, []);

//   useEffect(() => {
//     if (!showPayment) return;

//     setTimeLeft(300);

//     const interval = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           return 0;
//         }

//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [showPayment]);

//   const formatTime = (seconds) => {
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}:${String(s).padStart(2, "0")}`;
//   };

//   const copyText = async (text) => {
//     if (!text) return;

//     try {
//       await navigator.clipboard.writeText(String(text));
//       alert("Copied");
//     } catch {
//       alert("Copy failed");
//     }
//   };

//   const getStatusStyle = (status) => {
//     const s = String(status || "").toLowerCase();

//     if (s === "success" || s === "approved") {
//       return { background: "#dcfce7", color: "#166534" };
//     }

//     if (s === "rejected" || s === "failed") {
//       return { background: "#fee2e2", color: "#991b1b" };
//     }

//     return { background: "#fef3c7", color: "#92400e" };
//   };

//   const openAddCash = () => {
//     setError("");
//     setAmount("");
//     setUtr("");
//     setScreenshot(null);
//     setShowAddCash(true);
//     setShowPayment(false);
//     loadPaymentSettings();
//   };

//   const goToPayment = () => {
//     const addAmount = Number(amount);

//     if (!addAmount) return setError("Please enter amount");
//     if (addAmount < MIN_AMOUNT) return setError("Minimum add cash amount is ₹100");
//     if (addAmount > MAX_AMOUNT)
//       return setError("Maximum add cash amount is ₹1,00,000");

//     setError("");
//     setShowAddCash(false);
//     setShowPayment(true);
//   };

//   const submitDeposit = async () => {
//     const addAmount = Number(amount);

//     if (!addAmount || addAmount < MIN_AMOUNT) {
//       return setError("Minimum deposit ₹100 hai");
//     }

//     if (addAmount > MAX_AMOUNT) {
//       return setError("Maximum deposit ₹1,00,000 hai");
//     }

//     if (!utr.trim()) return setError("UTR / Transaction ID enter karo");
//     if (!screenshot) return setError("Payment screenshot upload karo");

//     try {
//       setLoading(true);
//       setError("");

//       const formData = new FormData();
//       formData.append("amount", addAmount);
//       formData.append("utr", utr.trim());
//       formData.append("screenshot", screenshot);

//       const res = await axios.post(`${API_BASE}/deposit/create`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       alert(res.data.msg || "Deposit request submitted");

//       setShowPayment(false);
//       setAmount("");
//       setUtr("");
//       setScreenshot(null);

//       await Promise.all([loadDeposits(), loadWallet()]);
//     } catch (err) {
//       setError(err.response?.data?.msg || "Deposit request failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (pageLoading) {
//     return <div style={styles.loading}>⏳ Loading Wallet...</div>;
//   }

//   const scannerPath = payment?.scannerImage || payment?.scanner?.image || "";
//   const scannerImage = scannerPath ? `${SERVER_BASE}${scannerPath}` : "";
//   const upiId = payment?.upiList?.[0] || "";
//   const bank = payment?.bank || {};

//   return (
//     <div style={styles.page}>
//       <div style={styles.container}>
//         <div style={styles.headerRow}>
//           <button style={styles.backBtn} onClick={() => navigate(-1)}>
//             ←
//           </button>
//           <h2 style={styles.title}>Balance</h2>
//           <span style={styles.online}>0 online</span>
//         </div>

//         {error && <div style={styles.error}>{error}</div>}



//         <div style={styles.card}>
//           <div style={styles.cardMain}>
//             <div
//               style={{
//                 ...styles.iconBox,
//                 background: "linear-gradient(135deg,#2563eb,#06b6d4)",
//               }}
//             >
//               💰
//             </div>

// <div style={styles.card}>
//           <div style={styles.cardMain}>
//             <div
//               style={{
//                 ...styles.iconBox,
//                 background: "linear-gradient(135deg,#f59e0b,#fcd34d)",
//               }}
//             >
//               🎁
//             </div>
//             <div style={styles.info}>
//               <p style={styles.label}>Bonus Coin</p>
//               <h1 style={styles.amount}>
//                 ₹ {Number(wallet.bonus || 0).toFixed(2)}
//               </h1>
//             </div>
//           </div>
//           <p style={styles.desc}>
//             Bonus coins can be used to play battles only.
//           </p>
//         </div>


//             <div style={styles.info}>
//               <p style={styles.label}>Deposit Coin</p>
//               <h1 style={styles.amount}>
//                 ₹ {Number(wallet.balance || 0).toFixed(2)}
//               </h1>
//             </div>
//           </div>

//           <div style={styles.btnRow}>
//             <button style={styles.addBtn} onClick={openAddCash}>
//               Add Cash <span style={styles.plus}>+</span>
//             </button>
//           </div>

//           <p style={styles.desc}>
//             Use to play Tournaments & Battles. Cannot be withdrawn.
//           </p>
//         </div>

//         <div style={styles.card}>
//           <div style={styles.cardMain}>
//             <div
//               style={{
//                 ...styles.iconBox,
//                 background: "linear-gradient(135deg,#16a34a,#86efac)",
//               }}
//             >
//               🏆
//             </div>

//             <div style={styles.info}>
//               <p style={styles.label}>Winning Coin</p>
//               <h1 style={styles.amount}>
//                 ₹ {Number(wallet.winnings || 0).toFixed(2)}
//               </h1>
//             </div>
//           </div>

//           <div style={styles.btnRow}>
//             <button
//               style={styles.withdrawBtn}
//               onClick={() => navigate("/withdraw")}
//             >
//               Withdraw 🏦
//             </button>
//           </div>

//           <p style={styles.desc}>
//             Withdrawable to UPI or Bank. Also usable for play.
//           </p>
//         </div>

//         <div style={styles.historyCard}>
//           <div style={styles.historyTabs}>
//             <button
//               onClick={() => setActiveHistory("deposit")}
//               style={{
//                 ...styles.historyTab,
//                 ...(activeHistory === "deposit" ? styles.activeHistoryTab : {}),
//               }}
//             >
//               Deposit History
//             </button>

//             <button
//               onClick={() => setActiveHistory("withdraw")}
//               style={{
//                 ...styles.historyTab,
//                 ...(activeHistory === "withdraw" ? styles.activeHistoryTab : {}),
//               }}
//             >
//               Withdraw History
//             </button>
//           </div>

//           <HistoryBox
//             empty={
//               activeHistory === "deposit"
//                 ? "No deposit request yet."
//                 : "No withdraw request yet."
//             }
//             items={activeHistory === "deposit" ? deposits : withdraws}
//             getStatusStyle={getStatusStyle}
//             type={activeHistory === "deposit" ? "deposit" : "withdraw"}
//           />
//         </div>
//       </div>

//       {showAddCash && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modal}>
//             <button style={styles.closeBtn} onClick={() => setShowAddCash(false)}>
//               ×
//             </button>

//             <h2 style={styles.modalTitle}>Add Money</h2>
//             <p style={styles.modalSub}>Minimum ₹100 और Maximum ₹1,00,000</p>

//             <input
//               type="number"
//               value={amount}
//               min={MIN_AMOUNT}
//               max={MAX_AMOUNT}
//               placeholder="Enter Amount"
//               onChange={(e) => setAmount(e.target.value)}
//               style={styles.input}
//             />

//             <div style={styles.depositNoteBox}>
//               <p style={styles.depositNoteLine}>
//                 <b>NOTE :-</b> कृपया UTR No.
//               </p>

//               <p style={styles.depositNoteLine}>
//                 सही से भरे, गलत UTR No. भरने पर Payment Add नहीं होगा, उसकी
//                 जिम्मेदारी खुद की होगी।
//               </p>

//               <p style={styles.depositNoteLine}>
//                 अगर UPI और Scanner पर Payment न हो तो Support से Contact करें।
//               </p>
//             </div>

//             <button style={styles.payBtn} onClick={goToPayment}>
//               Pay Fast
//             </button>
//           </div>
//         </div>
//       )}

//       {showPayment && (
//         <div style={styles.paymentPage}>
//           <div style={styles.paymentCard}>
//             <div style={styles.paymentHeader}>
//               <button
//                 style={styles.paymentBack}
//                 onClick={() => {
//                   setShowPayment(false);
//                   setShowAddCash(true);
//                 }}
//               >
//                 ←
//               </button>

//               <div style={styles.logo}>⚔️ AddaLudo</div>
//               <h2 style={styles.paymentTitle}>Complete Payment</h2>
//             </div>

//             <div style={styles.paymentBody}>
//               <div style={styles.paymentTopCard}>
//                 <p style={styles.scanText}>Pay ₹{Number(amount || 0).toFixed(2)}</p>

//                 <div style={styles.timerBox}>
//                   ⏱ Time remaining: <b>{formatTime(timeLeft)}</b>
//                 </div>
//               </div>

//               {scannerImage ? (
//                 <div style={styles.qrBox}>
//                   <img src={scannerImage} alt="Payment QR" style={styles.qrImg} />
//                 </div>
//               ) : (
//                 <div style={styles.noPaymentBox}>QR scanner not available</div>
//               )}

//               {upiId ? (
//                 <CopyRow label="UPI ID" value={upiId} onCopy={copyText} />
//               ) : (
//                 <div style={styles.noPaymentBox}>UPI ID not available</div>
//               )}

//               {bank?.name && (
//                 <CopyRow label="A/C Name" value={bank.name} onCopy={copyText} />
//               )}

//               {bank?.accountNumber && (
//                 <CopyRow
//                   label="A/C No."
//                   value={bank.accountNumber}
//                   onCopy={copyText}
//                 />
//               )}

//               {bank?.ifsc && (
//                 <CopyRow label="IFSC" value={bank.ifsc} onCopy={copyText} />
//               )}

//               <div style={styles.noteBox}>
//                 NOTE :- कृपया UPI और ACCOUNT details सही से भरे , गलत details भरने
//                 पर हमारी जिम्मेदार नहीं होगी !
//               </div>

//               <input
//                 type="text"
//                 value={utr}
//                 placeholder="Enter UTR / Transaction ID"
//                 onChange={(e) => setUtr(e.target.value)}
//                 style={styles.input}
//               />

//               <input
//                 type="file"
//                 accept="image/png,image/jpeg,image/jpg,image/webp"
//                 onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
//                 style={styles.fileInput}
//               />

//               {screenshot && <p style={styles.small}>Selected: {screenshot.name}</p>}

//               {error && <div style={{ ...styles.error, marginTop: 14 }}>{error}</div>}

//               <button
//                 style={styles.submitBtn}
//                 onClick={submitDeposit}
//                 disabled={loading}
//               >
//                 {loading ? "Submitting..." : "Submit Payment Proof"}
//               </button>

//               <button style={styles.cancelBtn} onClick={() => setShowPayment(false)}>
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function CopyRow({ label, value, onCopy }) {
//   return (
//     <div style={styles.copyRow}>
//       <div style={{ minWidth: 0 }}>
//         <p style={styles.copyLabel}>{label}</p>
//         <p style={styles.copyValue}>{value}</p>
//       </div>

//       <button style={styles.copyBtn} onClick={() => onCopy(value)}>
//         Copy
//       </button>
//     </div>
//   );
// }

// function HistoryBox({ empty, items, getStatusStyle, type }) {
//   return (
//     <div>
//       {items.length === 0 ? (
//         <p style={styles.desc}>{empty}</p>
//       ) : (
//         items.slice(0, 10).map((item) => (
//           <div key={item._id} style={styles.depositItem}>
//             <div>
//               <b>₹{item.amount}</b>

//               <p style={styles.small}>
//                 {type === "deposit"
//                   ? `UTR: ${item.utr || "-"}`
//                   : `Method: ${item.method || "-"}`}
//               </p>

//               <p style={styles.small}>
//                 {item.createdAt
//                   ? new Date(item.createdAt).toLocaleString("en-IN")
//                   : "-"}
//               </p>
//             </div>

//             <span style={{ ...styles.status, ...getStatusStyle(item.status) }}>
//               {item.status || "pending"}
//             </span>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// const styles = {
//   page: {
//     minHeight: "100vh",
//     background: "linear-gradient(135deg,#f8fafc,#eef2ff)",
//   },

//   container: {
//     padding: "72px 14px 105px",
//     maxWidth: "480px",
//     margin: "0 auto",
//   },

//   headerRow: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     marginBottom: "20px",
//   },

//   backBtn: {
//     width: 42,
//     height: 42,
//     borderRadius: 14,
//     border: "none",
//     background: "#fff",
//     fontSize: 24,
//     fontWeight: 900,
//   },

//   title: {
//     flex: 1,
//     margin: 0,
//     fontSize: 27,
//     fontWeight: 900,
//     color: "#0f172a",
//   },

//   online: {
//     color: "#64748b",
//     fontSize: 13,
//     fontWeight: 700,
//   },

//   card: {
//     background: "#fff",
//     borderRadius: 22,
//     padding: 18,
//     marginBottom: 16,
//     boxShadow: "0 18px 45px rgba(15,23,42,.07)",
//   },

//   cardMain: {
//     display: "flex",
//     alignItems: "center",
//     gap: 15,
//   },

//   iconBox: {
//     width: 70,
//     height: 70,
//     borderRadius: 20,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     color: "#fff",
//     fontSize: 32,
//   },

//   info: { flex: 1 },

//   label: {
//     margin: "0 0 6px",
//     color: "#64748b",
//     fontSize: 15,
//     fontWeight: 800,
//   },

//   amount: {
//     margin: 0,
//     color: "#0f172a",
//     fontSize: 27,
//     fontWeight: 900,
//   },

//   btnRow: {
//     display: "flex",
//     justifyContent: "flex-end",
//     marginTop: 12,
//   },

//   addBtn: {
//     border: "none",
//     background: "linear-gradient(135deg,#2563eb,#06b6d4)",
//     color: "#fff",
//     borderRadius: 14,
//     padding: "11px 15px",
//     fontSize: 16,
//     fontWeight: 900,
//   },

//   withdrawBtn: {
//     border: "1px solid #bbf7d0",
//     background: "#f0fdf4",
//     color: "#166534",
//     borderRadius: 14,
//     padding: "11px 15px",
//     fontSize: 16,
//     fontWeight: 900,
//   },

//   plus: {
//     marginLeft: 7,
//     fontSize: 20,
//   },

//   desc: {
//     margin: "12px 0 0",
//     color: "#64748b",
//     fontSize: 13,
//     lineHeight: 1.45,
//   },

//   error: {
//     background: "#fee2e2",
//     color: "#991b1b",
//     padding: 10,
//     borderRadius: 12,
//     marginBottom: 12,
//     fontWeight: 800,
//     fontSize: 13,
//   },

//   loading: {
//     minHeight: "70vh",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontWeight: 900,
//   },

//   historyCard: {
//     background: "#fff",
//     borderRadius: 22,
//     padding: 18,
//     marginBottom: 16,
//     boxShadow: "0 18px 45px rgba(15,23,42,.07)",
//   },

//   historyTabs: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: 10,
//     marginBottom: 14,
//   },

//   historyTab: {
//     border: "2px solid #e5e7eb",
//     background: "#fff",
//     color: "#0f172a",
//     borderRadius: 16,
//     padding: "12px 8px",
//     fontSize: 16,
//     fontWeight: 900,
//   },

//   activeHistoryTab: {
//     border: "2px solid #22c55e",
//     background: "#f0fdf4",
//     color: "#166534",
//   },

//   depositItem: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderBottom: "1px solid #e5e7eb",
//     padding: "10px 0",
//     gap: 10,
//   },

//   small: {
//     margin: "4px 0 0",
//     color: "#64748b",
//     fontSize: 12,
//   },

//   status: {
//     padding: "6px 9px",
//     borderRadius: 999,
//     fontWeight: 900,
//     fontSize: 11,
//     textTransform: "uppercase",
//     whiteSpace: "nowrap",
//   },

//   modalOverlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(15,23,42,.65)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 18,
//     zIndex: 9999,
//   },

//   modal: {
//     width: "100%",
//     maxWidth: 380,
//     background: "#fff",
//     borderRadius: 24,
//     padding: 20,
//     position: "relative",
//   },

//   closeBtn: {
//     position: "absolute",
//     right: 14,
//     top: 12,
//     border: "none",
//     background: "#e0f2fe",
//     width: 34,
//     height: 34,
//     borderRadius: "50%",
//     fontSize: 22,
//     fontWeight: 900,
//   },

//   modalTitle: {
//     margin: "0 0 5px",
//     fontSize: 25,
//     fontWeight: 900,
//     color: "#0f172a",
//   },

//   modalSub: {
//     margin: "0 0 13px",
//     color: "#64748b",
//     fontSize: 13,
//     fontWeight: 700,
//   },

//   input: {
//     width: "100%",
//     boxSizing: "border-box",
//     border: "2px solid #e2e8f0",
//     borderRadius: 15,
//     padding: 13,
//     fontSize: 15,
//     fontWeight: 800,
//     outline: "none",
//     marginTop: 10,
//     background: "#fff",
//   },

//   depositNoteBox: {
//     marginTop: 14,
//     background: "#fff7ed",
//     border: "1px solid #fed7aa",
//     borderRadius: 14,
//     padding: "11px 12px",
//     color: "#111827",
//     fontSize: 12,
//     fontWeight: 800,
//     lineHeight: 1.55,
//   },

//   depositNoteLine: {
//     margin: "0 0 7px",
//   },

//   payBtn: {
//     width: "100%",
//     marginTop: 14,
//     border: "none",
//     borderRadius: 15,
//     padding: 13,
//     background: "linear-gradient(135deg,#2563eb,#7c3aed)",
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: 900,
//   },

//   paymentPage: {
//     position: "fixed",
//     inset: 0,
//     background: "#eef2ff",
//     zIndex: 99999,
//     overflowY: "auto",
//   },

//   paymentCard: {
//     maxWidth: 430,
//     margin: "0 auto",
//     background: "#fff",
//     minHeight: "100vh",
//   },

//   paymentHeader: {
//     background: "linear-gradient(135deg,#0f172a,#1d4ed8,#7c3aed)",
//     color: "#fff",
//     display: "grid",
//     gridTemplateColumns: "42px 1fr 1.2fr",
//     alignItems: "center",
//     padding: "11px 12px",
//     gap: 7,
//   },

//   paymentBack: {
//     border: "none",
//     background: "rgba(255,255,255,.12)",
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: 900,
//     borderRadius: 12,
//     height: 36,
//   },

//   logo: {
//     fontSize: 15,
//     fontWeight: 900,
//   },

//   paymentTitle: {
//     margin: 0,
//     textAlign: "center",
//     fontSize: 17,
//     fontWeight: 900,
//   },

//   paymentBody: {
//     padding: 14,
//   },

//   paymentTopCard: {
//     background: "#eff6ff",
//     border: "1px solid #dbeafe",
//     borderRadius: 18,
//     padding: 13,
//   },

//   scanText: {
//     color: "#2563eb",
//     fontSize: 17,
//     fontWeight: 900,
//     margin: "0 0 8px",
//     textAlign: "center",
//   },

//   timerBox: {
//     background: "#ecfeff",
//     padding: 9,
//     borderRadius: 13,
//     textAlign: "center",
//     fontSize: 13,
//     color: "#0f172a",
//     fontWeight: 800,
//   },

//   qrBox: {
//     display: "flex",
//     justifyContent: "center",
//     marginTop: 13,
//   },

//   qrImg: {
//     width: 190,
//     height: 190,
//     objectFit: "contain",
//     background: "#fff",
//     borderRadius: 16,
//     border: "1px solid #e2e8f0",
//     padding: 8,
//   },

//   noPaymentBox: {
//     marginTop: 10,
//     background: "#f8fafc",
//     border: "1px dashed #cbd5e1",
//     color: "#64748b",
//     borderRadius: 14,
//     padding: "10px 12px",
//     fontSize: 12,
//     fontWeight: 900,
//     textAlign: "center",
//   },

//   copyRow: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: 10,
//     background: "#f8fafc",
//     border: "1px solid #e2e8f0",
//     borderRadius: 14,
//     padding: "10px 11px",
//     marginTop: 10,
//   },

//   copyLabel: {
//     margin: 0,
//     color: "#64748b",
//     fontSize: 11,
//     fontWeight: 900,
//   },

//   copyValue: {
//     margin: "3px 0 0",
//     color: "#0f172a",
//     fontSize: 13,
//     fontWeight: 900,
//     wordBreak: "break-all",
//   },

//   copyBtn: {
//     border: "none",
//     background: "#0f172a",
//     color: "#fff",
//     borderRadius: 10,
//     padding: "8px 10px",
//     fontSize: 12,
//     fontWeight: 900,
//   },

//   noteBox: {
//     marginTop: 12,
//     background: "#fff7ed",
//     border: "1px solid #fed7aa",
//     color: "#9a3412",
//     borderRadius: 14,
//     padding: "10px 12px",
//     fontSize: 12,
//     fontWeight: 900,
//     lineHeight: 1.5,
//   },

//   fileInput: {
//     width: "100%",
//     marginTop: 12,
//     border: "2px dashed #93c5fd",
//     borderRadius: 15,
//     padding: 12,
//     boxSizing: "border-box",
//     background: "#f8fafc",
//   },

//   submitBtn: {
//     width: "100%",
//     marginTop: 14,
//     border: "none",
//     borderRadius: 15,
//     padding: 14,
//     background: "linear-gradient(135deg,#16a34a,#22c55e)",
//     color: "#fff",
//     fontSize: 17,
//     fontWeight: 900,
//   },

//   cancelBtn: {
//     width: "100%",
//     marginTop: 9,
//     border: "none",
//     borderRadius: 15,
//     padding: 12,
//     background: "#e5e7eb",
//     color: "#0f172a",
//     fontSize: 15,
//     fontWeight: 900,
//   },
// };





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
      await Promise.all([loadWallet(), loadDeposits(), loadWithdraws(), loadPaymentSettings()]);
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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!showPayment) return;
    setTimeLeft(300);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      alert(res.data.msg || "Deposit request submitted");
      setShowPayment(false);
      setAmount("");
      setUtr("");
      setScreenshot(null);
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

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Header ── */}
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
          <h2 style={styles.title}>Balance</h2>
          <span style={styles.online}>0 online</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* ── CARD 1: Bonus Coin + Deposit Coin side-by-side ── */}
        <div style={styles.card}>
          <div style={styles.cardMain}>

            {/* Left wallet icon */}
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>
              💰
            </div>

            {/* Center: Bonus Coin */}
            <div style={styles.bonusSection}>
              <div style={styles.bonusIconRow}>
                <div style={{ ...styles.giftIconBox, background: "linear-gradient(135deg,#f59e0b,#fcd34d)" }}>
                  🎁
                </div>
                <div>
                  <p style={styles.label}>Bonus Coin</p>
                  <h1 style={styles.amount}>₹ {Number(wallet.bonus || 0).toFixed(2)}</h1>
                </div>
              </div>
              <p style={styles.bonusDesc}>Bonus coins can be used to play battles only.</p>
            </div>

            {/* Right: Deposit Coin */}
            <div style={styles.depositSection}>
              <p style={styles.depositLabel}>Deposit{"\n"}Coin</p>
              <p style={styles.depositRupee}>₹</p>
              <h2 style={styles.depositAmount}>{Number(wallet.balance || 0).toFixed(2)}</h2>
            </div>

          </div>

          {/* Add Cash button - right aligned */}
          <div style={styles.btnRow}>
            <button style={styles.addBtn} onClick={openAddCash}>
              Add Cash <span style={styles.plus}>+</span>
            </button>
          </div>

          <p style={styles.desc}>Use to play Tournaments &amp; Battles. Cannot be withdrawn.</p>
        </div>

        {/* ── CARD 2: Winning Coin ── */}
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
            <button style={styles.withdrawBtn} onClick={() => navigate("/withdraw")}>
              Withdraw 🏦
            </button>
          </div>

          <p style={styles.desc}>Withdrawable to UPI or Bank. Also usable for play.</p>
        </div>

        {/* ── History Card ── */}
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

      {/* ── Add Cash Modal ── */}
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
              <p style={styles.depositNoteLine}><b>NOTE :-</b> कृपया UTR No.</p>
              <p style={styles.depositNoteLine}>सही से भरे, गलत UTR No. भरने पर Payment Add नहीं होगा, उसकी जिम्मेदारी खुद की होगी।</p>
              <p style={styles.depositNoteLine}>अगर UPI और Scanner पर Payment न हो तो Support से Contact करें।</p>
            </div>

            <button style={styles.payBtn} onClick={goToPayment}>Pay Fast</button>
          </div>
        </div>
      )}

      {/* ── Payment Page ── */}
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
                <p style={styles.scanText}>Pay ₹{Number(amount || 0).toFixed(2)}</p>
                <div style={styles.timerBox}>⏱ Time remaining: <b>{formatTime(timeLeft)}</b></div>
              </div>

              {scannerImage ? (
                <div style={styles.qrBox}>
                  <img src={scannerImage} alt="Payment QR" style={styles.qrImg} />
                </div>
              ) : (
                <div style={styles.noPaymentBox}>QR scanner not available</div>
              )}

              {upiId ? <CopyRow label="UPI ID" value={upiId} onCopy={copyText} /> : <div style={styles.noPaymentBox}>UPI ID not available</div>}
              {bank?.name && <CopyRow label="A/C Name" value={bank.name} onCopy={copyText} />}
              {bank?.accountNumber && <CopyRow label="A/C No." value={bank.accountNumber} onCopy={copyText} />}
              {bank?.ifsc && <CopyRow label="IFSC" value={bank.ifsc} onCopy={copyText} />}

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
              <button style={styles.cancelBtn} onClick={() => setShowPayment(false)}>Cancel</button>
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
            <span style={{ ...styles.status, ...getStatusStyle(item.status) }}>
              {item.status || "pending"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc,#eef2ff)" },
  container: { padding: "72px 14px 105px", maxWidth: "480px", margin: "0 auto" },

  headerRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  backBtn: { width: 42, height: 42, borderRadius: 14, border: "none", background: "#fff", fontSize: 24, fontWeight: 900, cursor: "pointer" },
  title: { flex: 1, margin: 0, fontSize: 27, fontWeight: 900, color: "#0f172a" },
  online: { color: "#64748b", fontSize: 13, fontWeight: 700 },

  card: { background: "#fff", borderRadius: 22, padding: 18, marginBottom: 16, boxShadow: "0 18px 45px rgba(15,23,42,.07)" },

  /* ── Bonus+Deposit row ── */
  cardMain: { display: "flex", alignItems: "flex-start", gap: 12 },

  iconBox: { width: 62, height: 62, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 },

  bonusSection: { flex: 1, minWidth: 0 },
  bonusIconRow: { display: "flex", alignItems: "center", gap: 10 },
  giftIconBox: { width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 },
  bonusDesc: { margin: "8px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.4 },

  depositSection: { flexShrink: 0, textAlign: "right", paddingLeft: 8 },
  depositLabel: { margin: 0, color: "#64748b", fontSize: 13, fontWeight: 800, whiteSpace: "pre-line", lineHeight: 1.3 },
  depositRupee: { margin: "6px 0 0", fontSize: 22, fontWeight: 900, color: "#0f172a" },
  depositAmount: { margin: "2px 0 0", fontSize: 22, fontWeight: 900, color: "#0f172a" },

  info: { flex: 1 },
  label: { margin: "0 0 6px", color: "#64748b", fontSize: 15, fontWeight: 800 },
  amount: { margin: 0, color: "#0f172a", fontSize: 27, fontWeight: 900 },

  btnRow: { display: "flex", justifyContent: "flex-end", marginTop: 12 },
  addBtn: { border: "none", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", borderRadius: 14, padding: "11px 22px", fontSize: 16, fontWeight: 900, cursor: "pointer" },
  withdrawBtn: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", borderRadius: 14, padding: "11px 15px", fontSize: 16, fontWeight: 900, cursor: "pointer" },
  plus: { marginLeft: 7, fontSize: 20 },
  desc: { margin: "12px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.45 },

  error: { background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 12, marginBottom: 12, fontWeight: 800, fontSize: 13 },
  loading: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 },

  historyCard: { background: "#fff", borderRadius: 22, padding: 18, marginBottom: 16, boxShadow: "0 18px 45px rgba(15,23,42,.07)" },
  historyTabs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  historyTab: { border: "2px solid #e5e7eb", background: "#fff", color: "#0f172a", borderRadius: 16, padding: "12px 8px", fontSize: 16, fontWeight: 900, cursor: "pointer" },
  activeHistoryTab: { border: "2px solid #22c55e", background: "#f0fdf4", color: "#166534" },

  depositItem: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", padding: "10px 0", gap: 10 },
  small: { margin: "4px 0 0", color: "#64748b", fontSize: 12 },
  status: { padding: "6px 9px", borderRadius: 999, fontWeight: 900, fontSize: 11, textTransform: "uppercase", whiteSpace: "nowrap" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18, zIndex: 9999 },
  modal: { width: "100%", maxWidth: 380, background: "#fff", borderRadius: 24, padding: 20, position: "relative" },
  closeBtn: { position: "absolute", right: 14, top: 12, border: "none", background: "#e0f2fe", width: 34, height: 34, borderRadius: "50%", fontSize: 22, fontWeight: 900, cursor: "pointer" },
  modalTitle: { margin: "0 0 5px", fontSize: 25, fontWeight: 900, color: "#0f172a" },
  modalSub: { margin: "0 0 13px", color: "#64748b", fontSize: 13, fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", border: "2px solid #e2e8f0", borderRadius: 15, padding: 13, fontSize: 15, fontWeight: 800, outline: "none", marginTop: 10, background: "#fff" },
  depositNoteBox: { marginTop: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: "11px 12px", color: "#111827", fontSize: 12, fontWeight: 800, lineHeight: 1.55 },
  depositNoteLine: { margin: "0 0 7px" },
  payBtn: { width: "100%", marginTop: 14, border: "none", borderRadius: 15, padding: 13, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer" },

  paymentPage: { position: "fixed", inset: 0, background: "#eef2ff", zIndex: 99999, overflowY: "auto" },
  paymentCard: { maxWidth: 430, margin: "0 auto", background: "#fff", minHeight: "100vh" },
  paymentHeader: { background: "linear-gradient(135deg,#0f172a,#1d4ed8,#7c3aed)", color: "#fff", display: "grid", gridTemplateColumns: "42px 1fr 1.2fr", alignItems: "center", padding: "11px 12px", gap: 7 },
  paymentBack: { border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 22, fontWeight: 900, borderRadius: 12, height: 36, cursor: "pointer" },
  logo: { fontSize: 15, fontWeight: 900 },
  paymentTitle: { margin: 0, textAlign: "center", fontSize: 17, fontWeight: 900 },
  paymentBody: { padding: 14 },
  paymentTopCard: { background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 18, padding: 13 },
  scanText: { color: "#2563eb", fontSize: 17, fontWeight: 900, margin: "0 0 8px", textAlign: "center" },
  timerBox: { background: "#ecfeff", padding: 9, borderRadius: 13, textAlign: "center", fontSize: 13, color: "#0f172a", fontWeight: 800 },
  qrBox: { display: "flex", justifyContent: "center", marginTop: 13 },
  qrImg: { width: 190, height: 190, objectFit: "contain", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 8 },
  noPaymentBox: { marginTop: 10, background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#64748b", borderRadius: 14, padding: "10px 12px", fontSize: 12, fontWeight: 900, textAlign: "center" },
  copyRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "10px 11px", marginTop: 10 },
  copyLabel: { margin: 0, color: "#64748b", fontSize: 11, fontWeight: 900 },
  copyValue: { margin: "3px 0 0", color: "#0f172a", fontSize: 13, fontWeight: 900, wordBreak: "break-all" },
  copyBtn: { border: "none", background: "#0f172a", color: "#fff", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontWeight: 900, cursor: "pointer" },
  noteBox: { marginTop: 12, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 14, padding: "10px 12px", fontSize: 12, fontWeight: 900, lineHeight: 1.5 },
  fileInput: { width: "100%", marginTop: 12, border: "2px dashed #93c5fd", borderRadius: 15, padding: 12, boxSizing: "border-box", background: "#f8fafc" },
  submitBtn: { width: "100%", marginTop: 14, border: "none", borderRadius: 15, padding: 14, background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: 17, fontWeight: 900, cursor: "pointer" },
  cancelBtn: { width: "100%", marginTop: 9, border: "none", borderRadius: 15, padding: 12, background: "#e5e7eb", color: "#0f172a", fontSize: 15, fontWeight: 900, cursor: "pointer" },
};
