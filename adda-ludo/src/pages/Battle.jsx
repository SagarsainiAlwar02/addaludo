// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const API_BASE =
//   import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
//   "http://localhost:5000/api";

// const MAX_SEARCHING_BATTLES = 2;

// const Battle = () => {
//   const navigate = useNavigate();

//   const [betAmount, setBetAmount] = useState("");
//   const [openBattles, setOpenBattles] = useState([]);
//   const [myBattles, setMyBattles] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const token = localStorage.getItem("token");

//   const getUserId = () => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       if (user?._id || user?.id) return String(user._id || user.id);

//       const jwt = localStorage.getItem("token");
//       if (!jwt) return "";

//       const payload = JSON.parse(atob(jwt.split(".")[1] || ""));
//       return String(payload?._id || payload?.id || payload?.userId || payload?.user || "");
//     } catch {
//       return "";
//     }
//   };

//   const myId = getUserId();

//   const authHeader = () => ({
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   const getCreatorId = (battle) =>
//     String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "");

//   const getOpponentId = (battle) =>
//     String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "");

//   const hasMyResult = (battle) =>
//     Array.isArray(battle?.results)
//       ? battle.results.some((item) => String(item?.user?._id || item?.user || "") === myId)
//       : false;

//   const calculatePrize = (amount) => {
//     const amt = parseInt(amount, 10);
//     if (isNaN(amt)) return 0;

//     const totalPool = amt * 2;
//     let platformFee = 0;

//     if (amt >= 50 && amt <= 500) {
//       platformFee = amt * 0.05 * 2;
//     } else if (amt > 500 && amt <= 100000) {
//       platformFee = amt * 0.025 * 2;
//     }

//     return Math.floor(totalPool - platformFee);
//   };

//   const FAKE_RUNNING_BATTLES = [
//     {
//       battleId: "fake_run_1",
//       amount: 100,
//       prize: calculatePrize(100),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 482" },
//       opponent: { name: "Player 913" },
//     },
//     {
//       battleId: "fake_run_2",
//       amount: 250,
//       prize: calculatePrize(250),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 128" },
//       opponent: { name: "Player 674" },
//     },
//     {
//       battleId: "fake_run_3",
//       amount: 350,
//       prize: calculatePrize(350),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 739" },
//       opponent: { name: "Player 205" },
//     },
//     {
//       battleId: "fake_run_4",
//       amount: 50,
//       prize: calculatePrize(50),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 951" },
//       opponent: { name: "Player 318" },
//     },
//     {
//       battleId: "fake_run_5",
//       amount: 500,
//       prize: calculatePrize(500),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 611" },
//       opponent: { name: "Player 827" },
//     },
//     {
//       battleId: "fake_run_6",
//       amount: 750,
//       prize: calculatePrize(750),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 220" },
//       opponent: { name: "Player 446" },
//     },
//     {
//       battleId: "fake_run_7",
//       amount: 1000,
//       prize: calculatePrize(1000),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 792" },
//       opponent: { name: "Player 104" },
//     },
//     {
//       battleId: "fake_run_8",
//       amount: 1500,
//       prize: calculatePrize(1500),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 384" },
//       opponent: { name: "Player 569" },
//     },
//     {
//       battleId: "fake_run_9",
//       amount: 2000,
//       prize: calculatePrize(2000),
//       status: "running",
//       isFake: true,
//       createdBy: { name: "Player 735" },
//       opponent: { name: "Player 908" },
//     },

    


// {
//   battleId: "fake_run_12",
//   amount: 50,
//   prize: calculatePrize(50),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 333" },
//   opponent: { name: "Player 444" },
// },
// {
//   battleId: "fake_run_13",
//   amount: 100,
//   prize: calculatePrize(100),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 555" },
//   opponent: { name: "Player 666" },
// },
// {
//   battleId: "fake_run_14",
//   amount: 250,
//   prize: calculatePrize(250),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 777" },
//   opponent: { name: "Player 888" },
// },
// {
//   battleId: "fake_run_15",
//   amount: 500,
//   prize: calculatePrize(500),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 999" },
//   opponent: { name: "Player 121" },
// },
// {
//   battleId: "fake_run_16",
//   amount: 650,
//   prize: calculatePrize(650),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 232" },
//   opponent: { name: "Player 343" },
// },
// {
//   battleId: "fake_run_17",
//   amount: 890,
//   prize: calculatePrize(890),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 454" },
//   opponent: { name: "Player 565" },
// },
// {
//   battleId: "fake_run_18",
//   amount: 3000,
//   prize: calculatePrize(3000),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 676" },
//   opponent: { name: "Player 787" },
// },
// {
//   battleId: "fake_run_19",
//   amount: 6500,
//   prize: calculatePrize(6500),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 898" },
//   opponent: { name: "Player 909" },
// },
// {
//   battleId: "fake_run_20",
//   amount: 8000,
//   prize: calculatePrize(8000),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 147" },
//   opponent: { name: "Player 258" },
// },
// {
//   battleId: "fake_run_21",
//   amount: 10000,
//   prize: calculatePrize(10000),
//   status: "running",
//   isFake: true,
//   createdBy: { name: "Player 369" },
//   opponent: { name: "Player 741" },
// },


//   ];

//   const fetchBattles = async () => {
//     if (!token) return;

//     try {
//       const [openRes, myRes] = await Promise.all([
//         axios.get(`${API_BASE}/battle/open`, authHeader()),
//         axios.get(`${API_BASE}/battle/my`, authHeader()),
//       ]);

//       setOpenBattles(openRes.data?.battles || []);
//       setMyBattles(myRes.data?.battles || []);
//     } catch (err) {
//       console.log("Fetch error:", err.response?.data || err.message);
//     }
//   };

//   useEffect(() => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     fetchBattles();
//     const interval = setInterval(fetchBattles, 3000);

//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const allBattles = useMemo(() => {
//     const map = new Map();

//     [...openBattles, ...myBattles].forEach((battle) => {
//       if (battle?.battleId) map.set(battle.battleId, battle);
//     });

//     return Array.from(map.values());
//   }, [openBattles, myBattles]);

//   const mySearchingBattles = useMemo(() => {
//     return myBattles.filter((battle) => {
//       const status = String(battle?.status || "").toLowerCase();
//       return status === "open" && getCreatorId(battle) === myId;
//     });
//   }, [myBattles, myId]);

//   const myActiveBattle = useMemo(() => {
//     return myBattles.find((battle) => {
//       const status = String(battle?.status || "").toLowerCase();

//       const activeStatuses = [
//         "join_requested",
//         "running",
//         "room_submitted",
//         "result_submitted",
//         "cancel_requested",
//       ];

//       if (!activeStatuses.includes(status)) return false;

//       if (["result_submitted", "cancel_requested"].includes(status)) {
//         return !hasMyResult(battle);
//       }

//       return true;
//     });
//   }, [myBattles, myId]);

//   const visibleOpenBattles = useMemo(() => {
//     return allBattles
//       .filter((battle) => {
//         const status = String(battle?.status || "").toLowerCase();
//         const isCreator = getCreatorId(battle) === myId;
//         const isOpponent = getOpponentId(battle) === myId;

//         return status === "open" || (status === "join_requested" && (isCreator || isOpponent));
//       })
//       .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
//   }, [allBattles, myId]);

//   const runningBattles = useMemo(() => {
//     const realRunningBattles = allBattles
//       .filter((battle) =>
//         ["running", "room_submitted"].includes(String(battle?.status || "").toLowerCase())
//       )
//       .sort(
//         (a, b) =>
//           new Date(b.updatedAt || b.createdAt || 0) -
//           new Date(a.updatedAt || a.createdAt || 0)
//       );

//    return [...realRunningBattles, ...FAKE_RUNNING_BATTLES].filter(Boolean);
//   }, [allBattles]);

//   const pendingBattles = useMemo(() => {
//     return allBattles
//       .filter((battle) =>
//         ["result_submitted", "cancel_requested"].includes(String(battle?.status || "").toLowerCase())
//       )
//       .sort(
//         (a, b) =>
//           new Date(b.updatedAt || b.createdAt || 0) -
//           new Date(a.updatedAt || a.createdAt || 0)
//       );
//   }, [allBattles]);

//   const validateAmount = () => {
//     const amt = Number(betAmount);

//     if (!amt || amt < 50) return alert("Minimum battle amount ₹50 hai"), false;
//     if (amt > 100000) return alert("Maximum battle amount ₹100000 hai"), false;
//     if (amt % 50 !== 0) return alert("Amount ₹50 ke multiple me hona chahiye"), false;

//     return true;
//   };

//   const handleCreate = async () => {
//     if (!validateAmount()) return;

//     if (myActiveBattle) {
//       alert("Aapki ek battle already chal rahi hai. Pehle uska result update karo.");
//       return;
//     }

//     if (mySearchingBattles.length >= MAX_SEARCHING_BATTLES) {
//       alert("Searching me maximum 2 battle hi create kar sakte ho.");
//       return;
//     }

//     const amt = Number(betAmount);

//     const sameOpenAmount = allBattles.some((battle) => {
//       const status = String(battle?.status || "").toLowerCase();
//       return status === "open" && Number(battle?.amount) === amt;
//     });

//     if (sameOpenAmount) {
//       alert(`₹${amt} ki open battle already lagi hui hai.`);
//       return;
//     }

//     try {
//       setLoading(true);
//       await axios.post(`${API_BASE}/battle/create`, { amount: amt }, authHeader());
//       setBetAmount("");
//       await fetchBattles();
//       alert("Battle set ho gayi!");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Create failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const joinMatch = async (battleId) => {
//     if (myActiveBattle) {
//       alert("You are already in game.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const res = await axios.post(`${API_BASE}/battle/join/${battleId}`, {}, authHeader());
//       const joinedId = res.data?.battle?.battleId || battleId;

//       await fetchBattles();
//       navigate(`/room-code/${joinedId}`);
//     } catch (err) {
//       alert(err.response?.data?.msg || "Join failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const startBattle = async (battleId) => {
//     try {
//       setLoading(true);
//       const res = await axios.post(`${API_BASE}/battle/start/${battleId}`, {}, authHeader());
//       const startedId = res.data?.battle?.battleId || battleId;

//       await fetchBattles();
//       navigate(`/room-code/${startedId}`);
//     } catch (err) {
//       alert(err.response?.data?.msg || "Start failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const rejectBattle = async (battleId) => {
//     if (!window.confirm("Player request reject karni hai?")) return;

//     try {
//       setLoading(true);
//       await axios.post(`${API_BASE}/battle/reject/${battleId}`, {}, authHeader());
//       await fetchBattles();
//       alert("Request reject ho gayi");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Reject failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cancelBattle = async (battleId) => {
//     if (!window.confirm("Cancel this battle?")) return;

//     try {
//       setLoading(true);
//       await axios.patch(`${API_BASE}/battle/cancel/${battleId}`, {}, authHeader());
//       await fetchBattles();
//       alert("Battle cancelled");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Cancel failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getOpenAction = (battle) => {
//     const status = String(battle?.status || "").toLowerCase();
//     const isMine = getCreatorId(battle) === myId;
//     const isOpponent = getOpponentId(battle) === myId;

//     if (status === "open" && isMine) {
//       return (
//         <button
//           disabled={loading}
//           onClick={() => cancelBattle(battle.battleId)}
//           className="rounded-2xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-600 ring-1 ring-red-200 disabled:opacity-50"
//         >
//           Cancel
//         </button>
//       );
//     }

//     if (status === "open" && !isMine) {
//       return (
//         <button
//           disabled={loading}
//           onClick={() => joinMatch(battle.battleId)}
//           className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-500/30 active:scale-95 disabled:opacity-50"
//         >
//           PLAY
//         </button>
//       );
//     }

//     if (status === "join_requested" && isMine) {
//       return (
//         <div className="flex flex-col gap-2">
//           <button
//             disabled={loading}
//             onClick={() => startBattle(battle.battleId)}
//             className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white"
//           >
//             START
//           </button>

//           <button
//             disabled={loading}
//             onClick={() => rejectBattle(battle.battleId)}
//             className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white"
//           >
//             REJECT
//           </button>
//         </div>
//       );
//     }

//     if (status === "join_requested" && isOpponent) {
//       return (
//         <div className="flex flex-col items-center gap-1">
//           <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
//           <p className="text-[10px] font-black text-slate-500">WAITING</p>
//         </div>
//       );
//     }

//     return (
//       <button disabled className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-500">
//         BUSY
//       </button>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-[#eef3ff] px-3 pb-28 pt-4 text-slate-950">
//       <div className="mx-auto max-w-md">
//         <div className="mb-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#111827] via-[#202b65] to-[#06b6d4] p-[1px] shadow-2xl shadow-blue-900/20">
//           <div className="rounded-[27px] bg-white/10 p-4 backdrop-blur-xl">
//             <div className="flex items-center justify-center">
//               <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100">
//                 Adda Ludo
//               </p>
//             </div>

//             <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-center text-sm font-bold leading-6 text-white ring-1 ring-white/10">
//               अगर कोई Popular में Code देता है तो I'D Block कर दी जाएगी !
//             </div>
//           </div>
//         </div>


//      <div className="mb-5 rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-200">
//   <div className="mb-3 flex items-center justify-between">
//     <div>
//       <h2 className="text-base font-bold">Create Battle</h2>
//       <p className="text-[11px] font-medium text-slate-400">
//         Amount डालो और challenge create करो
//       </p>
//     </div>

//     <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white">
//       Rules
//     </button>
//   </div>

//   <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2 ring-1 ring-slate-200">
//     <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-base font-semibold shadow-sm">
//       ₹
//     </div>

//     <input
//       type="number"
//       placeholder="Enter Amount"
//       className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold outline-none placeholder:text-slate-400"
//       value={betAmount}
//       min="50"
//       max="100000"
//       step="50"
//       onChange={(e) => setBetAmount(e.target.value)}
//     />

//     <button
//       disabled={loading}
//       onClick={handleCreate}
//       className="rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-60"
//     >
//       {loading ? "..." : "Set"}
//     </button>
//   </div>
// </div>

//         <SectionTitle title="Open Battles" badge={visibleOpenBattles.length} gradient="from-cyan-500 to-blue-600" />

//         <div className="space-y-4">
//           {visibleOpenBattles.length === 0 && <EmptyBox text="No Battles Live" />}
//           {visibleOpenBattles.map((battle) => (
//             <OpenCard
//               key={battle.battleId}
//               battle={battle}
//               action={getOpenAction(battle)}
//               calculatePrize={calculatePrize}
//             />
//           ))}
//         </div>

//         <SectionTitle title="Running Battles" badge={runningBattles.length} gradient="from-violet-600 to-indigo-700" />

//         <div className="space-y-4">
         
//           {runningBattles.length === 0 && <EmptyBox text="No Running Battles" />}



//   {pendingBattles.filter(Boolean).map((battle) => (
//   <MatchCard
//     key={battle.battleId}
//     battle={battle}
//     type="pending"
//     calculatePrize={calculatePrize}
//     myId={myId}
//     onClick={() => navigate(`/room-code/${battle.battleId}`)}
//   />
// ))}
//         </div>

//         <SectionTitle title="Pending Results" badge={pendingBattles.length} gradient="from-amber-500 to-orange-600" />

//         <div className="space-y-4">
//           {pendingBattles.length === 0 && <EmptyBox text="No Pending Results" />}
//           {pendingBattles.map((battle) => (
//             <MatchCard
//               key={battle.battleId}
//               battle={battle}
//               type="pending"
//               calculatePrize={calculatePrize}
//               onClick={() => navigate(`/room-code/${battle.battleId}`)}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };


// function SectionTitle({ title, badge, gradient }) {
//   return (
//     <div className="mb-3 mt-7 flex items-center justify-between">
//       <h3 className="text-lg font-black text-slate-900">{title}</h3>

//       {badge > 0 && (
//         <div className={`rounded-2xl bg-gradient-to-r ${gradient} px-4 py-2 text-sm font-black text-white shadow-lg`}>
//           {badge}
//         </div>
//       )}
//     </div>
//   );
// }

// function EmptyBox({ text }) {
//   return (
//     <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm font-black uppercase text-slate-400">
//       {text}
//     </div>
//   );
// }


// function OpenCard({ battle, action, calculatePrize }) {
//   return (
//     <div className="overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200">
//       <div className="flex items-center justify-between gap-2 px-3 py-2">
//         <div className="min-w-0">
//           <p className="text-[11px] font-semibold text-slate-500">Challenge From</p>
//           <h3 className="truncate text-sm font-bold text-slate-900">
//             {battle.createdBy?.name || "Player"}
//           </h3>
//         </div>

//         <div className="shrink-0">{action}</div>
//       </div>

//       <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-2">
//         <MoneyBlock label="Entry Fee" value={battle.amount} />
//         <MoneyBlock label="Winning" value={battle.prize || calculatePrize(battle.amount)} right />
//       </div>
//     </div>
//   );
// }

// function MatchCard({ battle, type, calculatePrize, onClick, myId }) {
//   const isPending = type === "pending";

//   const isMine =
//     String(
//       battle?.createdBy?._id ||
//       battle?.createdBy?.id ||
//       battle?.createdBy ||
//       ""
//     ) === myId;

//   const isOpponent =
//     String(
//       battle?.opponent?._id ||
//       battle?.opponent?.id ||
//       battle?.opponent ||
//       ""
//     ) === myId;

//   const bg = isPending

//   return (
//     <div
//       onClick={onClick}
//       className={`cursor-pointer overflow-hidden rounded-xl bg-white p-3 shadow-md ring-1 active:scale-[0.99] ${
//         isPending ? "ring-orange-200" : "ring-indigo-200"
//       }`}
//     >
//       <div className="mb-2 flex items-center justify-between gap-2">
//         <div className="min-w-0">
//           <p className="text-[11px] font-semibold text-slate-500">
//             {isPending ? "Result Waiting" : "Running Battle"}
//           </p>

//           <h3 className="truncate text-sm font-bold text-slate-900">
//             {battle.createdBy?.name || "Player"} VS {battle.opponent?.name || "Opponent"}
//           </h3>
//         </div>


//         <div className="flex items-center gap-2">
//   <div
//     className={`rounded-md px-2 py-1 text-[11px] font-bold ${
//       isPending
//         ? "bg-orange-100 text-orange-700"
//         : "bg-green-100 text-green-700"
//     }`}
//   >
//     {isPending ? "Pending" : "Live"}
//   </div>

// {!isPending && (isMine || isOpponent) && (
//   <button
//     className="rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm"
//   >
//     View
//   </button>
// )}
// </div>
        
//       </div>

//       <div className="grid grid-cols-3 items-center gap-2 border-t border-slate-100 pt-2">
//         <MoneyBlock label="Entry Fee" value={battle.amount} />

//         <div className="flex justify-center">
//          <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-xs font-bold text-white shadow-md">
//   VS
// </div>
//         </div>

//         <MoneyBlock
//           label="Winning"
//           value={battle.prize || calculatePrize(battle.amount)}
//           right
//         />
//       </div>
//     </div>
//   );
// }

// function MoneyBlock({ label, value, right = false }) {
//   return (
//     <div className={right ? "text-right" : "text-left"}>
//       <p className="text-[11px] font-medium text-slate-500">
//         {label}
//       </p>
//       <p className="mt-0.5 text-sm font-semibold text-slate-950">
//         ₹{value}
//       </p>
//     </div>
//   );
// }

// export default Battle;





import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const MAX_SEARCHING_BATTLES = 2;

const calculatePrizeAmount = (amount) => {
  const amt = parseInt(amount, 10);
  if (isNaN(amt)) return 0;

  const totalPool = amt * 2;
  let platformFee = 0;

  if (amt >= 50 && amt <= 500) {
    platformFee = amt * 0.05 * 2;
  } else if (amt > 500 && amt <= 100000) {
    platformFee = amt * 0.025 * 2;
  }

  return Math.floor(totalPool - platformFee);
};

const FAKE_RUNNING_BATTLES = [
  { battleId: "fake_run_1", amount: 50, prize: calculatePrizeAmount(50), status: "running", isFake: true, createdBy: { name: "Player 333" }, opponent: { name: "Player 444" } },
  { battleId: "fake_run_2", amount: 100, prize: calculatePrizeAmount(100), status: "running", isFake: true, createdBy: { name: "Player 555" }, opponent: { name: "Player 666" } },
  { battleId: "fake_run_3", amount: 250, prize: calculatePrizeAmount(250), status: "running", isFake: true, createdBy: { name: "Player 777" }, opponent: { name: "Player 888" } },
  { battleId: "fake_run_4", amount: 500, prize: calculatePrizeAmount(500), status: "running", isFake: true, createdBy: { name: "Player 999" }, opponent: { name: "Player 121" } },
  { battleId: "fake_run_5", amount: 650, prize: calculatePrizeAmount(650), status: "running", isFake: true, createdBy: { name: "Player 232" }, opponent: { name: "Player 343" } },
  { battleId: "fake_run_6", amount: 890, prize: calculatePrizeAmount(890), status: "running", isFake: true, createdBy: { name: "Player 454" }, opponent: { name: "Player 565" } },
  { battleId: "fake_run_7", amount: 2000, prize: calculatePrizeAmount(2000), status: "running", isFake: true, createdBy: { name: "Player 512" }, opponent: { name: "Player 624" } },
  { battleId: "fake_run_8", amount: 2500, prize: calculatePrizeAmount(2500), status: "running", isFake: true, createdBy: { name: "Player 735" }, opponent: { name: "Player 846" } },
  { battleId: "fake_run_9", amount: 3000, prize: calculatePrizeAmount(3000), status: "running", isFake: true, createdBy: { name: "Player 676" }, opponent: { name: "Player 787" } },
  { battleId: "fake_run_10", amount: 3500, prize: calculatePrizeAmount(3500), status: "running", isFake: true, createdBy: { name: "Player 279" }, opponent: { name: "Player 381" } },
  { battleId: "fake_run_11", amount: 4000, prize: calculatePrizeAmount(4000), status: "running", isFake: true, createdBy: { name: "Player 492" }, opponent: { name: "Player 504" } },
  { battleId: "fake_run_12", amount: 4500, prize: calculatePrizeAmount(4500), status: "running", isFake: true, createdBy: { name: "Player 615" }, opponent: { name: "Player 726" } },
  { battleId: "fake_run_13", amount: 6500, prize: calculatePrizeAmount(6500), status: "running", isFake: true, createdBy: { name: "Player 898" }, opponent: { name: "Player 909" } },
  { battleId: "fake_run_14", amount: 8000, prize: calculatePrizeAmount(8000), status: "running", isFake: true, createdBy: { name: "Player 147" }, opponent: { name: "Player 258" } },
  { battleId: "fake_run_15", amount: 10000, prize: calculatePrizeAmount(10000), status: "running", isFake: true, createdBy: { name: "Player 369" }, opponent: { name: "Player 741" } },
];

const getCreatorId = (battle) =>
  String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "");

const getOpponentId = (battle) =>
  String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "");

const Battle = () => {
  const navigate = useNavigate();

  const [betAmount, setBetAmount] = useState("");
  const [openBattles, setOpenBattles] = useState([]);
  const [myBattles, setMyBattles] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token");

  const myId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?._id || user?.id) return String(user._id || user.id);

      const jwt = localStorage.getItem("token");
      if (!jwt) return "";

      const payload = JSON.parse(atob(jwt.split(".")[1] || ""));
      return String(payload?._id || payload?.id || payload?.userId || payload?.user || "");
    } catch {
      return "";
    }
  }, []);

  const authHeader = useCallback(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const calculatePrize = useCallback((amount) => calculatePrizeAmount(amount), []);

  const hasMyResult = useCallback(
    (battle) =>
      Array.isArray(battle?.results)
        ? battle.results.some((item) => String(item?.user?._id || item?.user || "") === myId)
        : false,
    [myId]
  );

  const fetchBattles = useCallback(async () => {
    if (!token) return;

    try {
      const [openRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/battle/open`, authHeader()),
        axios.get(`${API_BASE}/battle/my`, authHeader()),
      ]);

      setOpenBattles(Array.isArray(openRes.data?.battles) ? openRes.data.battles : []);
      setMyBattles(Array.isArray(myRes.data?.battles) ? myRes.data.battles : []);
    } catch (err) {
      console.log("Fetch error:", err.response?.data || err.message);
    }
  }, [token, authHeader]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBattles();

    const interval = setInterval(() => {
      fetchBattles();
    }, 10000);

    return () => clearInterval(interval);
  }, [token, navigate, fetchBattles]);

  const allBattles = useMemo(() => {
    const map = new Map();

    for (const battle of [...openBattles, ...myBattles]) {
      if (!battle?.battleId) continue;
      map.set(battle.battleId, battle);
    }

    return Array.from(map.values());
  }, [openBattles, myBattles]);

  const mySearchingBattles = useMemo(() => {
    const list = [];

    for (const battle of myBattles) {
      const status = String(battle?.status || "").toLowerCase();
      if (status === "open" && getCreatorId(battle) === myId) {
        list.push(battle);
      }
    }

    return list;
  }, [myBattles, myId]);

  const myActiveBattle = useMemo(() => {
    const activeStatuses = new Set([
      "join_requested",
      "running",
      "room_submitted",
      "result_submitted",
      "cancel_requested",
    ]);

    for (const battle of myBattles) {
      const status = String(battle?.status || "").toLowerCase();
      if (!activeStatuses.has(status)) continue;

      if (status === "result_submitted" || status === "cancel_requested") {
        if (!hasMyResult(battle)) return battle;
      } else {
        return battle;
      }
    }

    return null;
  }, [myBattles, hasMyResult]);

  const visibleOpenBattles = useMemo(() => {
    const list = [];

    for (const battle of allBattles) {
      const status = String(battle?.status || "").toLowerCase();
      const isCreator = getCreatorId(battle) === myId;
      const isOpponent = getOpponentId(battle) === myId;

      if (status === "open" || (status === "join_requested" && (isCreator || isOpponent))) {
        list.push(battle);
      }
    }

    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [allBattles, myId]);

  const runningBattles = useMemo(() => {
    const realRunningBattles = [];

    for (const battle of allBattles) {
      const status = String(battle?.status || "").toLowerCase();

      if (status === "running" || status === "room_submitted") {
        realRunningBattles.push(battle);
      }
    }

    realRunningBattles.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

    return [...realRunningBattles, ...FAKE_RUNNING_BATTLES];
  }, [allBattles]);

  const pendingBattles = useMemo(() => {
    const list = [];

    for (const battle of allBattles) {
      const status = String(battle?.status || "").toLowerCase();

      if (status === "result_submitted" || status === "cancel_requested") {
        list.push(battle);
      }
    }

    list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

    return list;
  }, [allBattles]);

  const validateAmount = () => {
    const amt = Number(betAmount);

    if (!amt || amt < 50) {
      alert("Minimum battle amount ₹50 hai");
      return false;
    }

    if (amt > 100000) {
      alert("Maximum battle amount ₹100000 hai");
      return false;
    }

    if (amt % 50 !== 0) {
      alert("Amount ₹50 ke multiple me hona chahiye");
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateAmount()) return;

    if (myActiveBattle) {
      alert("Aapki ek battle already chal rahi hai. Pehle uska result update karo.");
      return;
    }

    if (mySearchingBattles.length >= MAX_SEARCHING_BATTLES) {
      alert("Searching me maximum 2 battle hi create kar sakte ho.");
      return;
    }

    const amt = Number(betAmount);

    const sameOpenAmount = allBattles.some((battle) => {
      const status = String(battle?.status || "").toLowerCase();
      return status === "open" && Number(battle?.amount) === amt;
    });

    if (sameOpenAmount) {
      alert(`₹${amt} ki open battle already lagi hui hai.`);
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(`${API_BASE}/battle/create`, { amount: amt }, authHeader());
      setBetAmount("");
      fetchBattles();
      alert("Battle set ho gayi!");
    } catch (err) {
      alert(err.response?.data?.msg || "Create failed");
    } finally {
      setActionLoading(false);
    }
  };

  const joinMatch = async (battleId) => {
    if (myActiveBattle) {
      alert("You are already in game.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await axios.post(`${API_BASE}/battle/join/${battleId}`, {}, authHeader());
      const joinedId = res.data?.battle?.battleId || battleId;

      fetchBattles();
      navigate(`/room-code/${joinedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Join failed");
    } finally {
      setActionLoading(false);
    }
  };

  const startBattle = async (battleId) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`${API_BASE}/battle/start/${battleId}`, {}, authHeader());
      const startedId = res.data?.battle?.battleId || battleId;

      fetchBattles();
      navigate(`/room-code/${startedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Start failed");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectBattle = async (battleId) => {
    if (!window.confirm("Player request reject karni hai?")) return;

    try {
      setActionLoading(true);
      await axios.post(`${API_BASE}/battle/reject/${battleId}`, {}, authHeader());
      fetchBattles();
      alert("Request reject ho gayi");
    } catch (err) {
      alert(err.response?.data?.msg || "Reject failed");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelBattle = async (battleId) => {
    if (!window.confirm("Cancel this battle?")) return;

    try {
      setActionLoading(true);
      await axios.patch(`${API_BASE}/battle/cancel/${battleId}`, {}, authHeader());
      fetchBattles();
      alert("Battle cancelled");
    } catch (err) {
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getOpenAction = (battle) => {
    const status = String(battle?.status || "").toLowerCase();
    const isMine = getCreatorId(battle) === myId;
    const isOpponent = getOpponentId(battle) === myId;

    if (status === "open" && isMine) {
      return (
        <button
          disabled={actionLoading}
          onClick={() => cancelBattle(battle.battleId)}
          className="rounded-2xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-600 ring-1 ring-red-200 disabled:opacity-50"
        >
          Cancel
        </button>
      );
    }

    if (status === "open" && !isMine) {
      return (
        <button
          disabled={actionLoading}
          onClick={() => joinMatch(battle.battleId)}
          className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-500/30 active:scale-95 disabled:opacity-50"
        >
          PLAY
        </button>
      );
    }

    if (status === "join_requested" && isMine) {
      return (
        <div className="flex flex-col gap-2">
          <button
            disabled={actionLoading}
            onClick={() => startBattle(battle.battleId)}
            className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            START
          </button>

          <button
            disabled={actionLoading}
            onClick={() => rejectBattle(battle.battleId)}
            className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            REJECT
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isOpponent) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
          <p className="text-[10px] font-black text-slate-500">WAITING</p>
        </div>
      );
    }

    return (
      <button disabled className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-500">
        BUSY
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#eef3ff] px-3 pb-28 pt-4 text-slate-950">
      <div className="mx-auto max-w-md">
        <div className="mb-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#111827] via-[#202b65] to-[#06b6d4] p-[1px] shadow-2xl shadow-blue-900/20">
          <div className="rounded-[27px] bg-white/10 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-center">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100">
                Adda Ludo
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-center text-sm font-bold leading-6 text-white ring-1 ring-white/10">
              अगर कोई Popular में Code देता है तो I'D Block कर दी जाएगी !
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Create Battle</h2>
              <p className="text-[11px] font-medium text-slate-400">
                Amount डालो और challenge create करो
              </p>
            </div>

            <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Rules
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2 ring-1 ring-slate-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-base font-semibold shadow-sm">
              ₹
            </div>

            <input
              type="number"
              placeholder="Enter Amount"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold outline-none placeholder:text-slate-400"
              value={betAmount}
              min="50"
              max="100000"
              step="50"
              onChange={(e) => setBetAmount(e.target.value)}
            />

            <button
              disabled={actionLoading}
              onClick={handleCreate}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-60"
            >
              {actionLoading ? "..." : "Set"}
            </button>
          </div>
        </div>

        <SectionTitle title="Open Battles" badge={visibleOpenBattles.length} gradient="from-cyan-500 to-blue-600" />

        <div className="space-y-4">
          {visibleOpenBattles.length === 0 && <EmptyBox text="No Battles Live" />}

          {visibleOpenBattles.map((battle) => (
            <OpenCard
              key={battle.battleId}
              battle={battle}
              action={getOpenAction(battle)}
              calculatePrize={calculatePrize}
            />
          ))}
        </div>

        <SectionTitle title="Running Battles" badge={runningBattles.length} gradient="from-violet-600 to-indigo-700" />

        <div className="space-y-4">
          {runningBattles.length === 0 && <EmptyBox text="No Running Battles" />}

          {runningBattles.map((battle) => (
            <MatchCard
              key={battle.battleId}
              battle={battle}
              type="running"
              calculatePrize={calculatePrize}
              myId={myId}
              onClick={() => {
                if (battle.isFake) return;
                navigate(`/room-code/${battle.battleId}`);
              }}
            />
          ))}
        </div>

        <SectionTitle title="Pending Results" badge={pendingBattles.length} gradient="from-amber-500 to-orange-600" />

        <div className="space-y-4">
          {pendingBattles.length === 0 && <EmptyBox text="No Pending Results" />}

          {pendingBattles.map((battle) => (
            <MatchCard
              key={battle.battleId}
              battle={battle}
              type="pending"
              calculatePrize={calculatePrize}
              myId={myId}
              onClick={() => navigate(`/room-code/${battle.battleId}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function SectionTitle({ title, badge, gradient }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>

      {badge > 0 && (
        <div className={`rounded-2xl bg-gradient-to-r ${gradient} px-4 py-2 text-sm font-black text-white shadow-lg`}>
          {badge}
        </div>
      )}
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm font-black uppercase text-slate-400">
      {text}
    </div>
  );
}

function OpenCard({ battle, action, calculatePrize }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">Challenge From</p>
          <h3 className="truncate text-sm font-bold text-slate-900">
            {battle?.createdBy?.name || "Player"}
          </h3>
        </div>

        <div className="shrink-0">{action}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-2">
        <MoneyBlock label="Entry Fee" value={battle?.amount} />
        <MoneyBlock label="Winning" value={battle?.prize || calculatePrize(battle?.amount)} right />
      </div>
    </div>
  );
}

function MatchCard({ battle, type, calculatePrize, onClick, myId }) {
  if (!battle) return null;

  const isPending = type === "pending";

  const isMine =
    String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "") === myId;

  const isOpponent =
    String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "") === myId;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-xl bg-white p-3 shadow-md ring-1 active:scale-[0.99] ${
        isPending ? "ring-orange-200" : "ring-indigo-200"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">
            {isPending ? "Result Waiting" : "Running Battle"}
          </p>

          <h3 className="truncate text-sm font-bold text-slate-900">
            {battle?.createdBy?.name || "Player"} VS {battle?.opponent?.name || "Opponent"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`rounded-md px-2 py-1 text-[11px] font-bold ${
              isPending ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
            }`}
          >
            {isPending ? "Pending" : "Live"}
          </div>

          {!isPending && !battle?.isFake && (isMine || isOpponent) && (
            <button className="rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
              View
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 border-t border-slate-100 pt-2">
        <MoneyBlock label="Entry Fee" value={battle?.amount} />

        <div className="flex justify-center">
          <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-xs font-bold text-white shadow-md">
            VS
          </div>
        </div>

        <MoneyBlock label="Winning" value={battle?.prize || calculatePrize(battle?.amount)} right />
      </div>
    </div>
  );
}

function MoneyBlock({ label, value, right = false }) {
  return (
    <div className={right ? "text-right" : "text-left"}>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-950">₹{value || 0}</p>
    </div>
  );
}

export default Battle;






