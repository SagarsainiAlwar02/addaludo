import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const OPEN_BATTLE_SECONDS = 60;
const MAX_SEARCHING_BATTLES = 2;

const BOT_RUNNING_BATTLES = [
  { battleId: "bot_1", amount: 50, createdBy: { name: "Rohit" }, opponent: { name: "Amit" } },
  { battleId: "bot_2", amount: 100, createdBy: { name: "Vikas" }, opponent: { name: "Rahul" } },
  { battleId: "bot_3", amount: 200, createdBy: { name: "Deepak" }, opponent: { name: "Sahil" } },
  { battleId: "bot_4", amount: 300, createdBy: { name: "Mohit" }, opponent: { name: "Karan" } },
  { battleId: "bot_5", amount: 500, createdBy: { name: "Arjun" }, opponent: { name: "Nitin" } },
  { battleId: "bot_6", amount: 1000, createdBy: { name: "Sameer" }, opponent: { name: "Yash" } },
  { battleId: "bot_7", amount: 2500, createdBy: { name: "Ravi" }, opponent: { name: "Manish" } },
  { battleId: "bot_8", amount: 5000, createdBy: { name: "Ajay" }, opponent: { name: "Sandeep" } },
];

function calculatePrize(amount) {
  const totalPool = Number(amount) * 2;
  const commissionPercentPerUser = Number(amount) <= 500 ? 5 : 2.5;
  const commission = Math.floor((totalPool * commissionPercentPerUser * 2) / 100);
  return totalPool - commission;
}

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user?._id || user?.id) return String(user._id || user.id);

    const token = localStorage.getItem("token");
    if (!token) return "";

    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(payload?._id || payload?.id || payload?.userId || payload?.user || "");
  } catch {
    return "";
  }
}

function getBattleCreatorId(battle) {
  return String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "");
}

function getBattleOpponentId(battle) {
  return String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "");
}

function getBattleLeftSeconds(battle) {
  const createdAt = battle?.createdAt ? new Date(battle.createdAt).getTime() : Date.now();
  const used = Math.floor((Date.now() - createdAt) / 1000);
  return Math.max(0, OPEN_BATTLE_SECONDS - used);
}

export default function Battle() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [searchedAmount, setSearchedAmount] = useState(null);
  const [openBattles, setOpenBattles] = useState([]);
  const [myBattles, setMyBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const token = localStorage.getItem("token");
  const myId = getUserId();

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const validateAmount = (amountValue) => {
    const value = Number(amountValue);

    if (!value || value < 50) {
      alert("Minimum battle amount ₹50 hai");
      return false;
    }

    if (value > 100000) {
      alert("Maximum battle amount ₹100000 hai");
      return false;
    }

    if (value % 50 !== 0) {
      alert("Amount ₹50 ke multiple me hona chahiye");
      return false;
    }

    return true;
  };

  const fetchBattles = async () => {
    try {
      const [openRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/battle/open`, authHeader()),
        axios.get(`${API_BASE}/battle/my`, authHeader()),
      ]);

      setOpenBattles(openRes.data?.battles || []);
      setMyBattles(myRes.data?.battles || []);
    } catch (err) {
      console.log("Battle fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBattles();

    const fetchInterval = setInterval(fetchBattles, 3000);
    const clockInterval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(clockInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mySearchingBattles = useMemo(() => {
    return myBattles.filter((battle) => {
      const status = String(battle?.status || "").toLowerCase();
      const isCreator = getBattleCreatorId(battle) === myId;
      return isCreator && status === "open";
    });
  }, [myBattles, myId, tick]);

  const createBattle = async () => {
    if (!validateAmount(amount)) return;

    if (mySearchingBattles.length >= MAX_SEARCHING_BATTLES) {
      alert("Searching me maximum 2 battle hi create kar sakte ho");
      return;
    }

    const finalAmount = Number(amount);

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/battle/create`,
        { amount: finalAmount },
        authHeader()
      );

      setSearchedAmount(finalAmount);
      setAmount("");
      await fetchBattles();
    } catch (err) {
      alert(err.response?.data?.msg || "Battle create failed");
    } finally {
      setLoading(false);
    }
  };

  const playBattle = async (battleId) => {
    try {
      setLoading(true);

      await axios.post(`${API_BASE}/battle/join/${battleId}`, {}, authHeader());

      await fetchBattles();
      alert("Play request sent. Creator Start karega tab room page khulega.");
    } catch (err) {
      alert(err.response?.data?.msg || "Play request failed");
    } finally {
      setLoading(false);
    }
  };

  const startBattle = async (battleId) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/battle/start/${battleId}`,
        {},
        authHeader()
      );

      const startedId = res.data?.battle?.battleId || battleId;

      await fetchBattles();
      navigate(`/room-code/${startedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Start battle failed");
    } finally {
      setLoading(false);
    }
  };

  const rejectBattle = async (battleId) => {
    if (!window.confirm("Player request reject karni hai?")) return;

    try {
      setLoading(true);

      await axios.post(`${API_BASE}/battle/reject/${battleId}`, {}, authHeader());

      await fetchBattles();
      alert("Request reject ho gayi");
    } catch (err) {
      alert(err.response?.data?.msg || "Reject failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelOpenBattle = async (battleId) => {
    if (!window.confirm("Open battle cancel karni hai?")) return;

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE}/battle/cancel/${battleId}`,
        {},
        authHeader()
      );

      await fetchBattles();
      alert("Battle cancelled");
    } catch (err) {
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  const visibleOpenBattles = useMemo(() => {
    if (!searchedAmount) return [];

    const map = new Map();

    [...openBattles, ...myBattles].forEach((battle) => {
      const status = String(battle?.status || "").toLowerCase();
      const battleAmount = Number(battle?.amount);

      if (
        battle?.battleId &&
        ["open", "join_requested"].includes(status) &&
        battleAmount === Number(searchedAmount)
      ) {
        map.set(battle.battleId, battle);
      }
    });

    return Array.from(map.values()).slice(0, MAX_SEARCHING_BATTLES);
  }, [openBattles, myBattles, searchedAmount, tick]);

  const realRunningBattles = useMemo(() => {
    return myBattles.filter((b) =>
      [
        "running",
        "room_submitted",
        "result_submitted",
        "loss_submitted",
        "cancel_requested",
        "approved",
        "rejected",
        "cancelled",
      ].includes(String(b.status || "").toLowerCase())
    );
  }, [myBattles]);

  const runningBattles = useMemo(() => {
    return [...realRunningBattles, ...BOT_RUNNING_BATTLES];
  }, [realRunningBattles]);

  const getAction = (battle) => {
    if (battle.battleId?.startsWith("bot_")) {
      return (
        <button
          disabled
          className="rounded-xl bg-white/20 px-5 py-2 text-sm font-black text-white"
        >
          Running
        </button>
      );
    }

    const status = String(battle?.status || "").toLowerCase();
    const creatorId = getBattleCreatorId(battle);
    const opponentId = getBattleOpponentId(battle);

    const isCreator = creatorId && myId && creatorId === myId;
    const isOpponent = opponentId && myId && opponentId === myId;

    if (status === "open" && isCreator) {
      return (
        <div className="flex flex-col items-center gap-2">
          <WaitingSpinner />
          <CountdownText battle={battle} />
          <button
            disabled={loading}
            onClick={() => cancelOpenBattle(battle.battleId)}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (status === "open" && !isCreator) {
      return (
        <div className="flex flex-col items-center gap-2">
          <CountdownText battle={battle} />
          <button
            disabled={loading}
            onClick={() => playBattle(battle.battleId)}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            Play
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isCreator) {
      return (
        <div className="flex flex-col gap-2">
          <button
            disabled={loading}
            onClick={() => startBattle(battle.battleId)}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            Start
          </button>

          <button
            disabled={loading}
            onClick={() => rejectBattle(battle.battleId)}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isOpponent) {
      return (
        <div className="flex flex-col items-center gap-2">
          <WaitingSpinner />
          <p className="text-xs font-black text-slate-600">Waiting Start</p>
        </div>
      );
    }

    return (
      <button
        onClick={() => navigate(`/room-code/${battle.battleId}`)}
        className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-black text-white"
      >
        View
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-3 pt-20 pb-28 text-black">
      <div className="mx-auto max-w-[650px]">
        <div className="mb-4 rounded-xl bg-[#1f2937] px-4 py-4 text-center text-[15px] font-bold leading-7 text-white shadow-md">
          गोटी open होने के बाद अगर कोई भी user left होता है तो lose माना जायेगा
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
            ⚔️ Search Battle Amount
          </div>

          <div className="space-y-4 p-4">
            <input
              type="number"
              placeholder="Battle amount enter karo"
              value={amount}
              min="50"
              max="100000"
              step="50"
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 font-bold outline-none focus:border-cyan-500"
            />

            <button
              disabled={loading || mySearchingBattles.length >= MAX_SEARCHING_BATTLES}
              onClick={createBattle}
              className="w-full rounded-xl bg-gradient-to-b from-red-500 to-red-700 py-3 font-black text-white disabled:opacity-60"
            >
              Set Amount
            </button>

            <p className="text-center text-xs font-black text-slate-500">
              Searching battle: {mySearchingBattles.length}/{MAX_SEARCHING_BATTLES} • open battle 60 second me auto remove hogi
            </p>
          </div>
        </div>

        <SectionTitle title="🔥 Open Battles" />

        {!searchedAmount ? (
          <EmptyBox text="Amount set karo, usi amount ki battle yaha dikhegi" />
        ) : visibleOpenBattles.length === 0 ? (
          <EmptyBox text={`₹${searchedAmount} ki koi open battle nahi hai`} />
        ) : (
          visibleOpenBattles.map((battle) => (
            <BattleCard
              key={battle.battleId}
              battle={battle}
              action={getAction(battle)}
            />
          ))
        )}

        <SectionTitle title="🏃 Running Battles" />

        {runningBattles.map((battle) => (
          <BattleCard
            key={battle.battleId}
            battle={battle}
            dark
            action={getAction(battle)}
          />
        ))}
      </div>
    </div>
  );
}

function CountdownText({ battle }) {
  const left = getBattleLeftSeconds(battle);

  return (
    <p className={`text-xs font-black ${left <= 10 ? "text-red-600" : "text-slate-600"}`}>
      {left}s wait
    </p>
  );
}

function WaitingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-green-600" />
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="mt-5 mb-3 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
        {title}
      </div>
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="mb-3 rounded-2xl bg-white p-5 text-center font-black text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function BattleCard({ battle, action, dark = false }) {
  const winPrize = battle.prize || calculatePrize(battle.amount);

  return (
    <div
      className={`mb-3 overflow-hidden rounded-2xl border shadow-sm ${
        dark
          ? "border-violet-200 bg-[#342b72] text-white"
          : "border-cyan-100 bg-white text-black"
      }`}
    >
      <div
        className={`border-b px-4 py-2 text-sm font-black ${
          dark ? "border-white/15" : "border-slate-100 bg-cyan-50 text-slate-700"
        }`}
      >
        {battle.createdBy?.name || "Player"} vs{" "}
        {battle.opponent?.name || "Waiting..."}
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-4 py-3">
        <div>
          <p
            className={`text-xs font-black ${
              dark ? "text-white/70" : "text-slate-500"
            }`}
          >
            Entry Fee
          </p>
          <p className="mt-1 text-2xl font-black">₹{battle.amount}</p>
        </div>

        <div className="text-center">{action}</div>

        <div className="text-right">
          <p
            className={`text-xs font-black ${
              dark ? "text-white/70" : "text-slate-500"
            }`}
          >
            Winning
          </p>
          <p
            className={`mt-1 text-2xl font-black ${
              dark ? "" : "text-emerald-700"
            }`}
          >
            ₹{winPrize}
          </p>
        </div>
      </div>
    </div>
  );
}