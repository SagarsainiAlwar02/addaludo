// import React, { useEffect, useMemo, useState } from "react";
// import { ArrowLeft } from "lucide-react";
// import axios from "axios";
// import { useNavigate, useParams } from "react-router-dom";

// const API_BASE =
//   import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
//   (window.location.hostname === "localhost"
//     ? "http://localhost:5000/api"
//     : "https://api.addaludo.com/api");

// const FILE_BASE =
//   window.location.hostname === "localhost"
//     ? "http://localhost:5000"
//     : "https://api.addaludo.com";

// function getUserId() {
//   try {
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     return String(user?._id || user?.id || "");
//   } catch {
//     return "";
//   }
// }

// export default function RoomCode() {
//   const { battleId } = useParams();
//   const navigate = useNavigate();

//   const [battle, setBattle] = useState(null);
//   const [roomCode, setRoomCode] = useState("");
//   const [screenshot, setScreenshot] = useState(null);
//   const [selectedResult, setSelectedResult] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [pageLoading, setPageLoading] = useState(true);
//   const [now, setNow] = useState(Date.now());

//   const token = localStorage.getItem("token");
//   const myId = getUserId();

//   const authHeader = () => ({
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   const fetchBattle = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/battle/${battleId}`, authHeader());
//       setBattle(res.data.battle);
//       setRoomCode(res.data.battle?.ludoKingRoomCode || "");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Battle load failed");
//       navigate("/battle");
//     } finally {
//       setPageLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     fetchBattle();
//     const interval = setInterval(fetchBattle, 3000);
//     const timerInterval = setInterval(() => setNow(Date.now()), 1000);

//     return () => {
//       clearInterval(interval);
//       clearInterval(timerInterval);
//     };
//     // eslint-disable-next-line
//   }, [battleId]);

//   const isCreator = useMemo(() => {
//     const creatorId = String(battle?.createdBy?._id || battle?.createdBy || "");
//     return creatorId === myId;
//   }, [battle, myId]);

//   const timerLeft = useMemo(() => {
//     if (!battle?.timerStartedAt) return 120;

//     const start = new Date(battle.timerStartedAt).getTime();
//     const diff = Math.floor((now - start) / 1000);
//     return Math.max(0, 120 - diff);
//   }, [battle, now]);

//   const saveRoomCode = async () => {
//     const code = roomCode.trim();

//     if (!/^\d{8}$/.test(code)) {
//       alert("Room code only 8 digit");
//       return;
//     }

//     try {
//       setLoading(true);

//       await axios.post(
//         `${API_BASE}/battle/room-code/${battleId}`,
//         { roomCode: code },
//         authHeader()
//       );

//       await fetchBattle();
//       alert("Room code saved");
//     } catch (err) {
//       alert(err.response?.data?.msg || "Room code save failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyCode = async () => {
//     if (!battle?.ludoKingRoomCode) return;
//     await navigator.clipboard.writeText(battle.ludoKingRoomCode);
//     alert("Room code copied");
//   };

//   const submitResult = async () => {
//     if (!selectedResult) {
//       alert("Win, Loss ya Cancel select karo");
//       return;
//     }

//     if (selectedResult === "win" && !screenshot) {
//       alert("Winning screenshot upload karo");
//       return;
//     }

//     try {
//       setLoading(true);

//       const formData = new FormData();
//       formData.append("result", selectedResult);

//       // ✅ Screenshot sirf WIN me jayega
//       if (selectedResult === "win" && screenshot) {
//         formData.append("screenshot", screenshot);
//       }

//       await axios.post(`${API_BASE}/battle/result/${battleId}`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       await fetchBattle();

//       if (selectedResult === "win") {
//         alert("Win result submitted. Admin approval pending.");
//       } else if (selectedResult === "loss") {
//         alert("Loss submitted. Admin approval pending.");
//       } else {
//         alert("Cancel request submitted.");
//       }
//     } catch (err) {
//       alert(err.response?.data?.msg || "Result submit failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (pageLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] pt-20 pb-28 font-black text-slate-800">
//         Loading Battle...
//       </div>
//     );
//   }

//   if (!battle) return null;

//   const canResult = ["running", "room_submitted", "cancel_requested"].includes(
//     battle.status
//   );

//   return (
//     <div className="min-h-screen bg-[#f4f6f8] px-3 pt-20 pb-28 text-black">
//       <div className="mx-auto max-w-[540px]">
//         <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//           <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-white">
//             <button
//               onClick={() => navigate("/battle")}
//               className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"
//             >
//               <ArrowLeft size={22} />
//             </button>

//             <h2 className="text-lg font-black">🎮 Battle Room</h2>
//           </div>

//           <div className="space-y-4 p-4">
//             <div className="rounded-2xl bg-[#342b72] p-4 text-white">
//               <div className="text-center">
//                 <p className="text-xs font-bold opacity-80">Match</p>
//                 <h2 className="mt-1 text-xl font-black">
//                   {battle.createdBy?.name || "User 1"} VS{" "}
//                   {battle.opponent?.name || "Waiting..."}
//                 </h2>
//               </div>

//               <div className="mt-4 grid grid-cols-3 gap-3 text-center">
//                 <div>
//                   <p className="text-xs font-bold opacity-80">Entry</p>
//                   <p className="text-xl font-black">₹{battle.amount}</p>
//                 </div>

//                 <div>
//                   <p className="text-xs font-bold opacity-80">Timer</p>
//                   <p className="text-xl font-black text-yellow-300">
//                     {timerLeft}s
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs font-bold opacity-80">Winning</p>
//                   <p className="text-xl font-black">₹{battle.prize}</p>
//                 </div>
//               </div>

//               <div className="mt-4 rounded-xl bg-white/10 p-3 text-center text-xs font-bold">
//                 Status: {battle.status}
//               </div>
//             </div>

//             {!battle.opponent && (
//               <InfoBox text="Opponent ka wait ho raha hai. Jab koi player join karega tab timer start hoga." />
//             )}

//             {battle.opponent && !battle.ludoKingRoomCode && !isCreator && (
//               <InfoBox text="Waiting for room code. Battle creator room code set karega." />
//             )}

//             {battle.opponent && !battle.ludoKingRoomCode && isCreator && (
//               <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
//                 <h2 className="text-lg font-black text-slate-900">
//                   Set Room Code
//                 </h2>

//                 <input
//                   value={roomCode}
//                   maxLength={8}
//                   onChange={(e) =>
//                     setRoomCode(e.target.value.replace(/\D/g, ""))
//                   }
//                   placeholder="Enter 8 digit room code"
//                   className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-black outline-none focus:border-cyan-500"
//                 />

//                 <button
//                   disabled={loading}
//                   onClick={saveRoomCode}
//                   className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black disabled:opacity-60"
//                 >
//                   {loading ? "Saving..." : "Submit Room Code"}
//                 </button>
//               </div>
//             )}

//             {battle.ludoKingRoomCode && (
//               <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
//                 <p className="text-sm font-black text-green-700">ROOM CODE</p>
//                 <p className="text-3xl font-black tracking-widest text-slate-900">
//                   {battle.ludoKingRoomCode}
//                 </p>

//                 <button
//                   onClick={copyCode}
//                   className="w-full rounded-xl bg-green-600 py-3 font-black text-white"
//                 >
//                   Copy Room Code
//                 </button>
//               </div>
//             )}

//             <div className="rounded-2xl bg-slate-50 p-4">
//               <h3 className="mb-2 text-base font-black text-slate-900">
//                 Instructions
//               </h3>

//               <ul className="list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
//                 <li>Sabhi match ki recording kare.</li>
//                 <li>
//                   Room code only classic mode ka set kare varna match cancel kare.
//                   Dusra room code set karne par ₹25 ki penalty lag jayegi.
//                 </li>
//                 <li>
//                   Result sahi update kare. Galat update karne par ₹50 ki penalty
//                   lagegi.
//                 </li>
//               </ul>
//             </div>

//             {canResult && (
//               <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
//                 <h2 className="text-lg font-black text-slate-900">
//                   Update Result
//                 </h2>

//                 <div className="grid grid-cols-3 gap-2">
//                   <ResultButton
//                     active={selectedResult === "win"}
//                     text="WIN"
//                     color="green"
//                     onClick={() => setSelectedResult("win")}
//                   />

//                   <ResultButton
//                     active={selectedResult === "loss"}
//                     text="LOSS"
//                     color="red"
//                     onClick={() => {
//                       setSelectedResult("loss");
//                       setScreenshot(null);
//                     }}
//                   />

//                   <ResultButton
//                     active={selectedResult === "cancel"}
//                     text="CANCEL"
//                     color="slate"
//                     onClick={() => {
//                       setSelectedResult("cancel");
//                       setScreenshot(null);
//                     }}
//                   />
//                 </div>

//                 {selectedResult === "win" && (
//                   <div>
//                     <p className="mb-2 text-sm font-bold text-slate-600">
//                       Upload winning screenshot
//                     </p>

//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={(e) =>
//                         setScreenshot(e.target.files?.[0] || null)
//                       }
//                       className="w-full rounded-xl border border-slate-200 p-3 text-sm"
//                     />
//                   </div>
//                 )}

//                 {selectedResult === "loss" && (
//                   <InfoBox text="Loss submit karne ke baad battle admin pending me jayegi. Screenshot ki zarurat nahi hai." />
//                 )}

//                 {selectedResult === "cancel" && (
//                   <InfoBox text="Cancel tabhi complete hoga jab dono users cancel submit karenge. Screenshot ki zarurat nahi hai." />
//                 )}

//                 <button
//                   disabled={loading}
//                   onClick={submitResult}
//                   className="w-full rounded-xl bg-orange-500 py-3 font-black text-white disabled:opacity-60"
//                 >
//                   {loading ? "Submitting..." : "Submit Result"}
//                 </button>
//               </div>
//             )}

//             {battle.status === "result_submitted" && (
//               <StatusBox
//                 color="yellow"
//                 text="Result submitted. Admin approval pending."
//               />
//             )}

//             {battle.status === "cancel_requested" && (
//               <StatusBox
//                 color="yellow"
//                 text="Cancel request submitted. Dusre user ka wait hai."
//               />
//             )}

//             {battle.status === "approved" && (
//               <StatusBox
//                 color="green"
//                 text="Winner Approved ✅ Prize Added in winning wallet."
//               />
//             )}

//             {battle.status === "rejected" && (
//               <StatusBox color="red" text="Battle rejected / refunded by admin." />
//             )}

//             {battle.status === "cancelled" && (
//               <StatusBox color="red" text="Battle cancelled. Amount refunded." />
//             )}

//             {battle.screenshot && (
//               <img
//                 src={`${FILE_BASE}${battle.screenshot}`}
//                 alt="result"
//                 className="mx-auto max-h-72 rounded-xl border"
//               />
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function InfoBox({ text }) {
//   return (
//     <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-center text-sm font-black text-yellow-800">
//       {text}
//     </div>
//   );
// }

// function StatusBox({ text, color }) {
//   const cls =
//     color === "green"
//       ? "bg-green-600 text-white"
//       : color === "red"
//       ? "bg-red-600 text-white"
//       : "bg-yellow-400 text-black";

//   return (
//     <div className={`rounded-xl p-3 text-center font-black ${cls}`}>
//       {text}
//     </div>
//   );
// }

// function ResultButton({ text, active, color, onClick }) {
//   const base =
//     color === "green"
//       ? "bg-green-600"
//       : color === "red"
//       ? "bg-red-600"
//       : "bg-slate-700";

//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-xl py-3 font-black text-white ${base} ${
//         active ? "ring-4 ring-yellow-300" : "opacity-80"
//       }`}
//     >
//       {text}
//     </button>
//   );
// }







import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Clock,
  ShieldCheck,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

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

export default function RoomCode() {
  const { battleId } = useParams();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [selectedResult, setSelectedResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const token = localStorage.getItem("token");
  const myId = getUserId();

  const authHeader = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const calculatePrize = (amount) => {
    const amt = Number(amount);
    if (!amt) return 0;

    const totalPool = amt * 2;
    const feeRate = amt <= 500 ? 0.1 : 0.05;

    return Math.floor(totalPool - totalPool * feeRate);
  };

  const fetchBattle = async () => {
    try {
      const res = await axios.get(`${API_BASE}/battle/${battleId}`, authHeader());
      const battleData = res.data.battle || res.data;

      setBattle(battleData);

      if (battleData?.ludoKingRoomCode && !roomCode) {
        setRoomCode(battleData.ludoKingRoomCode);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Battle load failed");
      navigate("/battle");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBattle();

    const interval = setInterval(fetchBattle, 3000);
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  const isCreator = useMemo(() => {
    const creatorId = String(battle?.createdBy?._id || battle?.createdBy || "");
    return creatorId === myId;
  }, [battle, myId]);

  const timerLeft = useMemo(() => {
    if (!battle?.timerStartedAt) return 120;

    const start = new Date(battle.timerStartedAt).getTime();
    const diff = Math.floor((now - start) / 1000);

    return Math.max(0, 120 - diff);
  }, [battle, now]);

  const saveRoomCode = async () => {
    const code = roomCode.trim();

    if (!/^\d{8}$/.test(code)) {
      alert("Room code only 8 digit hona chahiye");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/battle/room-code/${battleId}`,
        { roomCode: code },
        authHeader()
      );

      alert("Room code saved successfully");
      await fetchBattle();
    } catch (err) {
      alert(err.response?.data?.msg || "Room code save failed");
    } finally {
      setLoading(false);
    }
  };

  const submitResult = async () => {
    if (!selectedResult) {
      alert("Win, Loss ya Cancel select karo");
      return;
    }

    if (selectedResult === "win" && !screenshot) {
      alert("Winning screenshot upload karo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("result", selectedResult);

      if (selectedResult === "win" && screenshot) {
        formData.append("screenshot", screenshot);
      }

      await axios.post(`${API_BASE}/battle/result/${battleId}`, formData, {
        headers: {
          ...authHeader().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Result submitted successfully");
      setSelectedResult("");
      setScreenshot(null);
      await fetchBattle();
    } catch (err) {
      alert(err.response?.data?.msg || "Result submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-black">
        Loading Battle...
      </div>
    );
  }

  if (!battle) return null;

  const canResult = ["running", "room_submitted"].includes(battle.status);

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 pb-24 pt-6">
      <div className="mx-auto max-w-[500px]">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/battle")}
            className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <h2 className="text-xl font-black text-gray-800">1 VS 1 BATTLE</h2>
        </div>

        <div className="mb-6 rounded-[2rem] bg-gradient-to-br from-indigo-900 to-purple-800 p-6 text-white shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Creator
              </p>
              <p className="truncate text-sm font-black">
                {battle.createdBy?.name || "User 1"}
              </p>
            </div>

            <div className="px-4 text-xl font-black italic text-yellow-400">
              VS
            </div>

            <div className="flex-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Opponent
              </p>
              <p className="truncate text-sm font-black">
                {battle.opponent?.name || battle.joinedBy?.name || "Waiting..."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-center">
            <div>
              <p className="text-[10px] font-bold opacity-60">ENTRY FEE</p>
              <p className="text-xl font-black">₹{battle.amount}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold opacity-60">PRIZE MONEY</p>
              <p className="text-xl font-black text-yellow-400">
                ₹{calculatePrize(battle.amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          {battle.ludoKingRoomCode ? (
            <div className="space-y-4">
              <p className="text-xs font-black tracking-widest text-gray-400">
                LUDO KING ROOM CODE
              </p>

              <div className="flex items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-4">
                <span className="text-3xl font-black tracking-[6px] text-gray-800">
                  {battle.ludoKingRoomCode}
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(battle.ludoKingRoomCode);
                    alert("Copied");
                  }}
                  className="text-indigo-600 transition hover:scale-110"
                >
                  <Copy size={24} />
                </button>
              </div>
            </div>
          ) : isCreator ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 font-black text-gray-800">
                <ShieldCheck className="text-green-500" size={20} />
                <span>SET ROOM CODE</span>
              </div>

              <input
                type="text"
                maxLength={8}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ""))}
                placeholder="00000000"
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 text-center text-2xl font-black tracking-widest outline-none transition-all focus:border-indigo-500"
              />

              <button
                onClick={saveRoomCode}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 py-4 font-black text-white shadow-lg shadow-indigo-100 transition active:scale-95 disabled:opacity-60"
              >
                {loading ? "SAVING..." : "SET ROOM CODE"}
              </button>
            </div>
          ) : (
            <div className="py-4">
              <Clock className="mx-auto mb-2 animate-pulse text-orange-500" size={32} />
              <p className="font-black text-gray-600">Waiting for Creator...</p>
              <p className="mt-1 text-sm font-bold text-red-500">
                {timerLeft}s Timer Started
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-orange-800">
            <AlertCircle size={18} />
            <span>IMPORTANT INSTRUCTIONS</span>
          </div>

          <ul className="space-y-2 text-xs font-bold leading-relaxed text-orange-900/70">
            <li>• Sabhi match ki recording karein.</li>
            <li>
              • Room code only classic mode ka set karein varna match cancel karein.
            </li>
            <li>• Dusra code set karne par ₹25 penalty lagegi.</li>
            <li>• Galat result update karne par ₹50 penalty lagegi.</li>
          </ul>
        </div>

        {canResult && (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-black text-gray-800">UPDATE RESULT</h3>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedResult("win")}
                className={`rounded-xl py-3 text-sm font-black transition-all ${
                  selectedResult === "win"
                    ? "scale-105 bg-green-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                I WON
              </button>

              <button
                onClick={() => {
                  setSelectedResult("loss");
                  setScreenshot(null);
                }}
                className={`rounded-xl py-3 text-sm font-black transition-all ${
                  selectedResult === "loss"
                    ? "scale-105 bg-red-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                I LOST
              </button>

              <button
                onClick={() => {
                  setSelectedResult("cancel");
                  setScreenshot(null);
                }}
                className={`rounded-xl py-3 text-sm font-black transition-all ${
                  selectedResult === "cancel"
                    ? "scale-105 bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                CANCEL
              </button>
            </div>

            {selectedResult === "win" && (
              <div className="mb-6">
                <label className="mb-2 block text-[10px] font-black uppercase text-gray-400">
                  Upload Winning Screenshot
                </label>

                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-4 text-gray-400">
                  <ImageIcon size={24} className="mb-2" />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />

                  <span className="text-xs font-bold">
                    {screenshot ? screenshot.name : "Select Image"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={submitResult}
              disabled={
                loading ||
                !selectedResult ||
                (selectedResult === "win" && !screenshot)
              }
              className="w-full rounded-2xl bg-gray-900 py-4 font-black text-white transition disabled:opacity-20"
            >
              {loading ? "SUBMITTING..." : "SUBMIT RESULT"}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {(battle.status === "result_submitted" ||
            battle.status === "pending") && (
            <div className="rounded-2xl bg-yellow-400 p-4 text-center text-sm font-black text-black shadow-lg shadow-yellow-100">
              Result Submitted. Admin approval pending.
            </div>
          )}

          {battle.status === "approved" && (
            <div className="rounded-2xl bg-green-600 p-4 text-center text-sm font-black text-white shadow-lg shadow-green-100">
              WINNER APPROVED! Check Winning Wallet ✅
            </div>
          )}

          {battle.status === "cancelled" && (
            <div className="rounded-2xl bg-red-600 p-4 text-center text-sm font-black text-white">
              Battle Cancelled. Amount Refunded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}