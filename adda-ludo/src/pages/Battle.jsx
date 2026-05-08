// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const API_BASE =
//   import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
//   "http://localhost:5000/api";

// function calculatePrize(amount) {
//   const totalPool = Number(amount) * 2;
//   const commissionPercentPerUser = Number(amount) <= 500 ? 5 : 2.5;
//   const commission = Math.floor((totalPool * commissionPercentPerUser * 2) / 100);
//   return totalPool - commission;
// }

// function getUserId() {
//   try {
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     return String(user?._id || user?.id || "");
//   } catch {
//     return "";
//   }
// }

// export default function Battle() {
//   const navigate = useNavigate();

//   const [amount1, setAmount1] = useState("");
//   const [amount2, setAmount2] = useState("");
//   const [openBattles, setOpenBattles] = useState([]);
//   const [myBattles, setMyBattles] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const token = localStorage.getItem("token");
//   const myId = getUserId();

//   const authHeader = () => ({
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   const validateAmount = (amount) => {
//     const value = Number(amount);

//     if (!value || value < 50) {
//       alert("Minimum battle amount ₹50 hai");
//       return false;
//     }

//     if (value > 100000) {
//       alert("Maximum battle amount ₹100000 hai");
//       return false;
//     }

//     if (value % 50 !== 0) {
//       alert("Amount should be in multiple of ₹50");
//       return false;
//     }

//     return true;
//   };

//   const fetchBattles = async () => {
//     try {
//       const [openRes, myRes] = await Promise.all([
//         axios.get(`${API_BASE}/battle/open`, authHeader()),
//         axios.get(`${API_BASE}/battle/my`, authHeader()),
//       ]);

//       setOpenBattles(openRes.data?.battles || []);
//       setMyBattles(myRes.data?.battles || []);
//     } catch (err) {
//       console.log("Battle fetch error:", err.response?.data || err.message);
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
//     // eslint-disable-next-line
//   }, []);

//   const createBattle = async (amount) => {
//     if (!validateAmount(amount)) return;

//     try {
//       setLoading(true);

//       await axios.post(
//         `${API_BASE}/battle/create`,
//         { amount: Number(amount) },
//         authHeader()
//       );

//       setAmount1("");
//       setAmount2("");
//       await fetchBattles();

//       alert("Battle open ho gayi, ab sabhi users ko show hogi");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Battle create failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const joinBattle = async (battleId) => {
//     try {
//       setLoading(true);

//       const res = await axios.post(
//         `${API_BASE}/battle/join/${battleId}`,
//         {},
//         authHeader()
//       );

//       const joinedId = res.data?.battle?.battleId || battleId;

//       await fetchBattles();
//       navigate(`/room-code/${joinedId}`);
//     } catch (err) {
//       alert(err.response?.data?.msg || "Battle join failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cancelOpenBattle = async (battleId) => {
//     if (!window.confirm("Open battle cancel karni hai?")) return;

//     try {
//       setLoading(true);

//       await axios.patch(
//         `${API_BASE}/battle/cancel/${battleId}`,
//         {},
//         authHeader()
//       );

//       await fetchBattles();
//       alert("Battle cancelled aur amount refund ho gaya");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Cancel failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const runningBattles = useMemo(() => {
//     return myBattles.filter((b) =>
//       ["running", "room_submitted", "result_submitted", "loss_submitted", "cancel_requested"].includes(
//         b.status
//       )
//     );
//   }, [myBattles]);

//   const historyBattles = useMemo(() => {
//     return myBattles.filter((b) =>
//       ["approved", "rejected", "cancelled"].includes(b.status)
//     );
//   }, [myBattles]);

//   return (
//     <div className="min-h-screen bg-[#f4f6f8] px-3 pt-20 pb-28 text-black">
//       <div className="mx-auto max-w-[650px]">
//         <div className="mb-4 rounded-xl bg-[#1f2937] px-4 py-4 text-center text-[15px] font-bold leading-7 text-white shadow-md">
//           गोटी open होने के बाद अगर कोई भी user left होता है तो lose माना जायेगा
//         </div>

//         <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//           <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
//             ⚔️ Search Battle Amount
//           </div>

//           <div className="space-y-4 p-4">
//             <div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
//               Min ₹50, amount ₹50 ke multiple me, max ₹100000
//             </div>

//             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//               <div>
//                 <input
//                   type="number"
//                   placeholder="Amount 1"
//                   value={amount1}
//                   onChange={(e) => setAmount1(e.target.value)}
//                   className="w-full rounded-xl border border-gray-300 px-3 py-3 font-bold outline-none focus:border-cyan-500"
//                 />
//                 <button
//                   disabled={loading}
//                   onClick={() => createBattle(amount1)}
//                   className="mt-2 w-full rounded-xl bg-gradient-to-b from-red-500 to-red-700 py-3 font-black text-white disabled:opacity-60"
//                 >
//                   Set Amount 1
//                 </button>
//               </div>

//               <div>
//                 <input
//                   type="number"
//                   placeholder="Amount 2"
//                   value={amount2}
//                   onChange={(e) => setAmount2(e.target.value)}
//                   className="w-full rounded-xl border border-gray-300 px-3 py-3 font-bold outline-none focus:border-cyan-500"
//                 />
//                 <button
//                   disabled={loading}
//                   onClick={() => createBattle(amount2)}
//                   className="mt-2 w-full rounded-xl bg-gradient-to-b from-slate-800 to-slate-600 py-3 font-black text-white disabled:opacity-60"
//                 >
//                   Set Amount 2
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <SectionTitle title="🔥 Open Battles" />

//         {openBattles.length === 0 ? (
//           <EmptyBox text="Abhi koi open battle nahi hai" />
//         ) : (
//           openBattles.map((battle) => {
//             const creatorId = String(battle.createdBy?._id || battle.createdBy);
//             const isMine = creatorId === myId;

//             return (
//               <BattleCard
//                 key={battle.battleId}
//                 battle={battle}
//                 action={
//                   isMine ? (
//                     <button
//                       disabled={loading}
//                       onClick={() => cancelOpenBattle(battle.battleId)}
//                       className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
//                     >
//                       Cancel
//                     </button>
//                   ) : (
//                     <button
//                       disabled={loading}
//                       onClick={() => joinBattle(battle.battleId)}
//                       className="rounded-xl bg-green-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
//                     >
//                       Play
//                     </button>
//                   )
//                 }
//               />
//             );
//           })
//         )}

//         <SectionTitle title="🏃 Running Battles" />

//         {runningBattles.length === 0 ? (
//           <EmptyBox text="Abhi koi running battle nahi hai" />
//         ) : (
//           runningBattles.map((battle) => (
//             <BattleCard
//               key={battle.battleId}
//               battle={battle}
//               dark
//               action={
//                 <button
//                   onClick={() => navigate(`/room-code/${battle.battleId}`)}
//                   className="rounded-xl bg-white px-5 py-2 text-sm font-black text-blue-700"
//                 >
//                   View
//                 </button>
//               }
//             />
//           ))
//         )}

//         <SectionTitle title="📜 Battle History" />

//         {historyBattles.length === 0 ? (
//           <EmptyBox text="History empty hai" />
//         ) : (
//           historyBattles.map((battle) => (
//             <BattleCard
//               key={battle.battleId}
//               battle={battle}
//               action={
//                 <button
//                   onClick={() => navigate(`/room-code/${battle.battleId}`)}
//                   className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-black text-white"
//                 >
//                   View
//                 </button>
//               }
//             />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// function SectionTitle({ title }) {
//   return (
//     <div className="mt-5 mb-3 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
//       <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
//         {title}
//       </div>
//     </div>
//   );
// }

// function EmptyBox({ text }) {
//   return (
//     <div className="mb-3 rounded-2xl bg-white p-5 text-center font-black text-slate-500 shadow-sm">
//       {text}
//     </div>
//   );
// }

// function BattleCard({ battle, action, dark = false }) {
//   const winPrize = battle.prize || calculatePrize(battle.amount);

//   return (
//     <div
//       className={`mb-3 overflow-hidden rounded-2xl border shadow-sm ${
//         dark
//           ? "border-violet-200 bg-[#342b72] text-white"
//           : "border-cyan-100 bg-white text-black"
//       }`}
//     >
//       <div
//         className={`border-b px-4 py-2 text-sm font-black ${
//           dark ? "border-white/15" : "border-slate-100 bg-cyan-50 text-slate-700"
//         }`}
//       >
//         {battle.createdBy?.name || "Player"} vs{" "}
//         {battle.opponent?.name || "Waiting..."}
//       </div>

//       <div className="grid grid-cols-3 items-center gap-2 px-4 py-3">
//         <div>
//           <p className={`text-xs font-black ${dark ? "text-white/70" : "text-slate-500"}`}>
//             Entry Fee
//           </p>
//           <p className="mt-1 text-2xl font-black">₹{battle.amount}</p>
//         </div>

//         <div className="text-center">{action}</div>

//         <div className="text-right">
//           <p className={`text-xs font-black ${dark ? "text-white/70" : "text-slate-500"}`}>
//             Winning
//           </p>
//           <p className={`mt-1 text-2xl font-black ${dark ? "" : "text-emerald-700"}`}>
//             ₹{winPrize}
//           </p>
//         </div>
//       </div>

//       <div className={`px-4 pb-3 text-xs font-bold ${dark ? "text-white/70" : "text-slate-500"}`}>
//         Status: {battle.status}
//       </div>
//     </div>
//   );
// }












import React, { useEffect, useMemo, useState } from "react";
import { Sword, Eye, Plus } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://api.addaludo.com/api");

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?._id || user?.id || "");
  } catch {
    return "";
  }
}

export default function Battle() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const myId = getUserId();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [battleLoading, setBattleLoading] = useState(true);

  const [searchingBattles, setSearchingBattles] = useState([]);
  const [runningBattles, setRunningBattles] = useState([]);

  const authHeader = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchBattles = async () => {
    try {
      const [openRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/battle/open`, authHeader()),
        axios.get(`${API_BASE}/battle/my`, authHeader()),
      ]);

      const openBattles = openRes.data?.battles || [];
      const myBattles = myRes.data?.battles || [];

      setSearchingBattles(openBattles);

      setRunningBattles(
        myBattles.filter((b) =>
          [
            "running",
            "room_submitted",
            "cancel_requested",
            "result_submitted",
          ].includes(b.status)
        )
      );
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setBattleLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBattles();

    const interval = setInterval(fetchBattles, 3000);

    return () => clearInterval(interval);

    // eslint-disable-next-line
  }, []);

  const myActiveBattles = useMemo(() => {
    return searchingBattles.filter((battle) => {
      const creatorId = String(battle.createdBy?._id || battle.createdBy);
      return creatorId === myId;
    }).length;
  }, [searchingBattles, myId]);

  const calculatePrize = (battleAmount) => {
    const total = Number(battleAmount) * 2;

    if (battleAmount >= 50 && battleAmount <= 500) {
      return Math.floor(total - total * 0.1);
    }

    return Math.floor(total - total * 0.05);
  };

  const createBattle = async () => {
    const value = Number(amount);

    if (!value) {
      alert("Amount enter karo");
      return;
    }

    if (value < 50) {
      alert("Minimum battle amount ₹50 hai");
      return;
    }

    if (value > 100000) {
      alert("Maximum battle amount ₹100000 hai");
      return;
    }

    if (value % 50 !== 0) {
      alert("Amount multiple of ₹50 hona chahiye");
      return;
    }

    if (myActiveBattles >= 2) {
      alert("2 se jyda battle set nahi kar sakte");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/battle/create`,
        { amount: value },
        authHeader()
      );

      setAmount("");
      fetchBattles();

      alert("Battle created successfully");
    } catch (err) {
      alert(err.response?.data?.msg || "Battle create failed");
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async (battleId) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/battle/join/${battleId}`,
        {},
        authHeader()
      );

      fetchBattles();

      const joinedBattleId = res.data?.battle?.battleId || battleId;
      navigate(`/room-code/${joinedBattleId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Battle join failed");
    } finally {
      setLoading(false);
    }
  };

  if (battleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] pt-20 pb-28 text-xl font-black text-slate-800">
        Loading Battles...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-3 pt-20 pb-28 text-black">
      <div className="mx-auto max-w-[540px] space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-white">
            <h2 className="text-lg font-black">⚔️ Create Battle</h2>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-sm font-black text-slate-700">
                Search Battle Amount
              </p>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter amount"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-black outline-none focus:border-cyan-500"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-black">
                <span>Battle Amount</span>
                <span>₹{amount || 0}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm font-black text-green-700">
                <span>Winning Amount</span>
                <span>₹{amount ? calculatePrize(Number(amount)) : 0}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm font-black text-yellow-800">
              <ul className="list-disc space-y-2 pl-5">
                <li>Minimum amount ₹50</li>
                <li>Maximum amount ₹100000</li>
                <li>Amount multiple of ₹50 hona chahiye</li>
                <li>Ek user max 2 active battles hi create kar sakta hai</li>
                <li>₹50-₹500 = 10% platform fee</li>
                <li>₹501-₹100000 = 5% platform fee</li>
              </ul>
            </div>

            <button
              disabled={loading}
              onClick={createBattle}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-black text-white disabled:opacity-60"
            >
              <Plus size={20} />
              {loading ? "Creating..." : "Create Battle"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3 text-white">
            <h2 className="text-lg font-black">🔍 Searching Battles</h2>
          </div>

          <div className="space-y-3 p-4">
            {searchingBattles.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm font-black text-slate-500">
                No searching battles
              </div>
            )}

            {searchingBattles.map((battle) => {
              const creatorId = String(battle.createdBy?._id || battle.createdBy);
              const isMyBattle = creatorId === myId;

              return (
                <div
                  key={battle.battleId || battle._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        ₹{battle.amount}
                      </h2>

                      <p className="text-sm font-bold text-green-700">
                        Win ₹{battle.prize || calculatePrize(battle.amount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-slate-500">Status</p>
                      <p className="text-sm font-black text-cyan-600">
                        SEARCHING
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isMyBattle ? (
                      <button className="w-full rounded-xl bg-slate-300 py-3 font-black text-slate-700">
                        Waiting Opponent...
                      </button>
                    ) : (
                      <button
                        disabled={loading}
                        onClick={() => joinBattle(battle.battleId)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-black text-white disabled:opacity-60"
                      >
                        <Sword size={18} />
                        Join Battle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#342b72] to-[#5746b5] px-4 py-3 text-white">
            <h2 className="text-lg font-black">🎮 Running Battles</h2>
          </div>

          <div className="space-y-3 p-4">
            {runningBattles.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm font-black text-slate-500">
                No running battles
              </div>
            )}

            {runningBattles.map((battle) => (
              <div
                key={battle.battleId || battle._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      ₹{battle.amount}
                    </h2>

                    <p className="text-sm font-bold text-slate-600">
                      {battle.createdBy?.name || "User"} VS{" "}
                      {battle.opponent?.name || "Opponent"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-slate-500">Winning</p>
                    <p className="text-lg font-black text-green-700">
                      ₹{battle.prize || calculatePrize(battle.amount)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/room-code/${battle.battleId}`)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#342b72] py-3 font-black text-white"
                >
                  <Eye size={18} />
                  View Battle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}