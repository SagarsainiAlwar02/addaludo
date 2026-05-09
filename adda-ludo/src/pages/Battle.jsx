import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const MAX_SEARCHING_BATTLES = 2;

const Battle = () => {
  const navigate = useNavigate();

  const [betAmount, setBetAmount] = useState("");
  const [openBattles, setOpenBattles] = useState([]);
  const [myBattles, setMyBattles] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const getUserId = () => {
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
  };

  const myId = getUserId();

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const getCreatorId = (battle) =>
    String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "");

  const getOpponentId = (battle) =>
    String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "");

  const hasMyResult = (battle) =>
    Array.isArray(battle?.results)
      ? battle.results.some((item) => String(item?.user?._id || item?.user || "") === myId)
      : false;

  const calculatePrize = (amount) => {
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

  const fetchBattles = async () => {
    if (!token) return;

    try {
      const [openRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/battle/open`, authHeader()),
        axios.get(`${API_BASE}/battle/my`, authHeader()),
      ]);

      setOpenBattles(openRes.data?.battles || []);
      setMyBattles(myRes.data?.battles || []);
    } catch (err) {
      console.log("Fetch error:", err.response?.data || err.message);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allBattles = useMemo(() => {
    const map = new Map();

    [...openBattles, ...myBattles].forEach((battle) => {
      if (battle?.battleId) map.set(battle.battleId, battle);
    });

    return Array.from(map.values());
  }, [openBattles, myBattles]);

  const mySearchingBattles = useMemo(() => {
    return myBattles.filter((battle) => {
      const status = String(battle?.status || "").toLowerCase();
      return status === "open" && getCreatorId(battle) === myId;
    });
  }, [myBattles, myId]);

  const myActiveBattle = useMemo(() => {
    return myBattles.find((battle) => {
      const status = String(battle?.status || "").toLowerCase();

      const activeStatuses = [
        "join_requested",
        "running",
        "room_submitted",
        "result_submitted",
        "cancel_requested",
      ];

      if (!activeStatuses.includes(status)) return false;

      if (["result_submitted", "cancel_requested"].includes(status)) {
        return !hasMyResult(battle);
      }

      return true;
    });
  }, [myBattles, myId]);

  const visibleOpenBattles = useMemo(() => {
    return allBattles
      .filter((battle) => {
        const status = String(battle?.status || "").toLowerCase();
        const isCreator = getCreatorId(battle) === myId;
        const isOpponent = getOpponentId(battle) === myId;

        return status === "open" || (status === "join_requested" && (isCreator || isOpponent));
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [allBattles, myId]);

  const runningBattles = useMemo(() => {
    return allBattles
      .filter((battle) =>
        ["running", "room_submitted"].includes(String(battle?.status || "").toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
  }, [allBattles]);

  const pendingBattles = useMemo(() => {
    return allBattles
      .filter((battle) =>
        ["result_submitted", "cancel_requested"].includes(String(battle?.status || "").toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
  }, [allBattles]);

  const validateAmount = () => {
    const amt = Number(betAmount);

    if (!amt || amt < 50) return alert("Minimum battle amount ₹50 hai"), false;
    if (amt > 100000) return alert("Maximum battle amount ₹100000 hai"), false;
    if (amt % 50 !== 0) return alert("Amount ₹50 ke multiple me hona chahiye"), false;

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
      setLoading(true);
      await axios.post(`${API_BASE}/battle/create`, { amount: amt }, authHeader());
      setBetAmount("");
      await fetchBattles();
      alert("Battle set ho gayi!");
    } catch (err) {
      alert(err.response?.data?.msg || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const joinMatch = async (battleId) => {
    if (myActiveBattle) {
      alert("Aapki ek battle already chal rahi hai. Pehle uska result update karo.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/battle/join/${battleId}`, {}, authHeader());
      const joinedId = res.data?.battle?.battleId || battleId;

      await fetchBattles();
      navigate(`/room-code/${joinedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Join failed");
    } finally {
      setLoading(false);
    }
  };

  const startBattle = async (battleId) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/battle/start/${battleId}`, {}, authHeader());
      const startedId = res.data?.battle?.battleId || battleId;

      await fetchBattles();
      navigate(`/room-code/${startedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Start failed");
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

  const cancelBattle = async (battleId) => {
    if (!window.confirm("Cancel this battle?")) return;

    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/battle/cancel/${battleId}`, {}, authHeader());
      await fetchBattles();
      alert("Battle cancelled");
    } catch (err) {
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  const getOpenAction = (battle) => {
    const status = String(battle?.status || "").toLowerCase();
    const isMine = getCreatorId(battle) === myId;
    const isOpponent = getOpponentId(battle) === myId;

    if (status === "open" && isMine) {
      return (
        <button
          disabled={loading}
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
          disabled={loading}
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
            disabled={loading}
            onClick={() => startBattle(battle.battleId)}
            className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white"
          >
            START
          </button>

          <button
            disabled={loading}
            onClick={() => rejectBattle(battle.battleId)}
            className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white"
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
              गोटी open होने के बाद अगर कोई भी user left होता है तो lose माना जायेगा
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-[28px] bg-white p-4 shadow-xl shadow-slate-200/80 ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Create Battle</h2>
              <p className="text-xs font-bold text-slate-400">
                Amount डालो और challenge create करो
              </p>
            </div>

            <button className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-500/25">
              Rules
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-3xl bg-slate-100 p-2 ring-1 ring-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              ₹
            </div>

            <input
              type="number"
              placeholder="Enter Coin"
              className="min-w-0 flex-1 bg-transparent py-3 text-lg font-black outline-none placeholder:text-slate-400"
              value={betAmount}
              min="50"
              max="100000"
              step="50"
              onChange={(e) => setBetAmount(e.target.value)}
            />

            <button
              disabled={loading}
              onClick={handleCreate}
              className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-sm font-black tracking-wider text-white shadow-lg active:scale-95 disabled:opacity-60"
            >
              {loading ? "..." : "SET"}
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
              onClick={() => navigate(`/room-code/${battle.battleId}`)}
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

      <div className={`rounded-2xl bg-gradient-to-r ${gradient} px-4 py-2 text-sm font-black text-white shadow-lg`}>
        {badge}
      </div>
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
    <div className="overflow-hidden rounded-[28px] bg-white shadow-xl shadow-cyan-100/70 ring-1 ring-cyan-100">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-700">
          Challenge From
        </p>
        <h3 className="text-lg font-black text-slate-900">
          {battle.createdBy?.name || "Player"}
        </h3>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 p-4">
        <MoneyBlock label="Entry Fee" value={battle.amount} />
        <div className="flex justify-center">{action}</div>
        <MoneyBlock label="Winning" value={battle.prize || calculatePrize(battle.amount)} right />
      </div>
    </div>
  );
}

function MatchCard({ battle, type, calculatePrize, onClick }) {
  const isPending = type === "pending";
  const bg = isPending
    ? "from-[#fff7d6] via-[#fff0b8] to-[#ffd166]"
    : "from-[#33206d] via-[#4f46e5] to-[#7c3aed]";

  const textColor = isPending ? "text-slate-950" : "text-white";
  const muted = isPending ? "text-slate-600" : "text-white/75";

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-[28px] bg-gradient-to-br ${bg} p-4 shadow-xl active:scale-[0.99]`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>
            {isPending ? "Result Waiting" : "Game Play"}
          </p>
          <h3 className={`text-base font-black leading-5 ${textColor}`}>
            {battle.createdBy?.name || "Player"} VS {battle.opponent?.name || "Opponent"}
          </h3>
        </div>

        <div className={`rounded-2xl px-3 py-2 text-xs font-black ${isPending ? "bg-black/10 text-slate-900" : "bg-white/15 text-white"}`}>
          {isPending ? "PENDING" : "LIVE"}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-2">
        <MoneyBlock label="Entry Fee" value={battle.amount} dark={!isPending} />
        <div className="flex justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-black shadow-lg ${isPending ? "bg-white text-orange-600" : "bg-white text-indigo-700"}`}>
            VS
          </div>
        </div>
        <MoneyBlock label="Winning" value={battle.prize || calculatePrize(battle.amount)} right dark={!isPending} />
      </div>
    </div>
  );
}

function MoneyBlock({ label, value, right = false, dark = false }) {
  return (
    <div className={right ? "text-right" : "text-left"}>
      <p className={`text-[11px] font-black uppercase ${dark ? "text-white/70" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>
        ₹{value}
      </p>
    </div>
  );
}

export default Battle;