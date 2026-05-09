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
    const amt = Number(amount);
    const totalPool = amt * 2;
    const commissionPercent = amt <= 500 ? 5 : 2.5;
    const commission = Math.floor((totalPool * commissionPercent) / 100);
    return totalPool - commission;
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
      .filter((battle) => {
        const status = String(battle?.status || "").toLowerCase();
        return ["running", "room_submitted"].includes(status);
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
  }, [allBattles]);

  const pendingBattles = useMemo(() => {
    return allBattles
      .filter((battle) => {
        const status = String(battle?.status || "").toLowerCase();
        return ["result_submitted", "cancel_requested"].includes(status);
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
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
          className="rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-lg disabled:opacity-50"
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
          className="rounded-lg bg-gradient-to-b from-[#293241] via-[#6d3b3b] to-[#ef3b2d] px-8 py-3 text-base font-bold text-white shadow-md disabled:opacity-50"
        >
          Play
        </button>
      );
    }

    if (status === "join_requested" && isMine) {
      return (
        <div className="flex flex-col gap-2">
          <button
            disabled={loading}
            onClick={() => startBattle(battle.battleId)}
            className="rounded-lg bg-green-600 px-5 py-2 text-xs font-black text-white shadow-md disabled:opacity-50"
          >
            START
          </button>

          <button
            disabled={loading}
            onClick={() => rejectBattle(battle.battleId)}
            className="rounded-lg bg-red-600 px-5 py-2 text-xs font-black text-white shadow-md disabled:opacity-50"
          >
            REJECT
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isOpponent) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-green-500" />
          <p className="text-[10px] font-black text-slate-700">WAITING</p>
        </div>
      );
    }

    return (
      <button disabled className="rounded-lg bg-gray-400 px-5 py-2 text-xs font-black text-white">
        BUSY
      </button>
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#f7f7f7] px-4 pt-4 pb-28 font-sans text-black">
      <div className="mb-5 rounded-md bg-[#1f2b38] px-4 py-4 text-center text-[17px] font-semibold leading-8 text-white shadow">
        गोटी open होने के बाद अगर कोई भी user left होता है तो lose माना जायेगा
      </div>

      <div className="mb-7 rounded-2xl border-2 border-black bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-black">Create a Battle</h2>

          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-green-500 px-3 py-2 text-sm font-bold text-white shadow"
          >
            Rules
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-lg font-black">
              i
            </span>
          </button>
        </div>

        <div className="flex overflow-hidden rounded-xl border-2 border-black bg-white">
          <input
            type="number"
            placeholder="Enter Coin"
            className="min-w-0 flex-1 px-4 py-4 text-lg font-semibold outline-none"
            value={betAmount}
            min="50"
            max="100000"
            step="50"
            onChange={(e) => setBetAmount(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={handleCreate}
            className="min-w-[95px] bg-[#1f2b38] px-6 text-xl font-black tracking-widest text-white disabled:opacity-60"
          >
            {loading ? "..." : "SET"}
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] font-black text-slate-500">
          Searching Battle: {mySearchingBattles.length}/{MAX_SEARCHING_BATTLES}
        </p>
      </div>

      <SectionTitle icon="🕺" title="Open Battles" />

      <div className="space-y-4">
        {visibleOpenBattles.length === 0 && <EmptyBox text="No Battles Available" />}

        {visibleOpenBattles.map((battle) => (
          <OpenBattleCard
            key={battle.battleId}
            battle={battle}
            action={getOpenAction(battle)}
            calculatePrize={calculatePrize}
          />
        ))}
      </div>

      <SectionTitle icon="🏃‍♂️" title="Running Battles" />

      <div className="space-y-4">
        {runningBattles.length === 0 && <EmptyBox text="No Running Battles" />}

        {runningBattles.map((battle) => (
          <RunningCard
            key={battle.battleId}
            battle={battle}
            calculatePrize={calculatePrize}
            onClick={() => navigate(`/room-code/${battle.battleId}`)}
          />
        ))}
      </div>

      <SectionTitle icon="⏳" title="Pending Results" />

      <div className="space-y-4">
        {pendingBattles.length === 0 && <EmptyBox text="No Pending Results" />}

        {pendingBattles.map((battle) => (
          <PendingCard
            key={battle.battleId}
            battle={battle}
            calculatePrize={calculatePrize}
            onClick={() => navigate(`/room-code/${battle.battleId}`)}
          />
        ))}
      </div>
    </div>
  );
};

function SectionTitle({ icon, title }) {
  return (
    <div className="my-5 overflow-hidden rounded-lg border-2 border-black bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-gradient-to-r from-white via-[#111] to-white px-5 py-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-2xl font-black text-white drop-shadow">{title}</h3>
      </div>
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm font-black uppercase text-slate-400 shadow-sm">
      {text}
    </div>
  );
}

function OpenBattleCard({ battle, action, calculatePrize }) {
  return (
    <div className="overflow-hidden rounded-lg border border-cyan-200 bg-[#b6edf1] shadow-md">
      <div className="border-b border-black/20 px-4 py-3">
        <h3 className="text-xl font-black text-black">
          Challenge From {battle.createdBy?.name || "Player"}
        </h3>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-4 py-4">
        <div>
          <p className="text-base font-semibold text-slate-800">Entry Fee</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-black text-black">
            💸 {battle.amount}
          </p>
        </div>

        <div className="flex justify-center">{action}</div>

        <div className="text-right">
          <p className="text-base font-semibold text-slate-800">Winning Prize</p>
          <p className="mt-1 flex items-center justify-end gap-2 text-3xl font-black text-black">
            💸 {battle.prize || calculatePrize(battle.amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RunningCard({ battle, calculatePrize, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded-lg border border-violet-300 bg-[#4f4394] text-white shadow-md"
    >
      <div className="border-b border-white/20 px-4 py-3">
        <h3 className="text-xl font-black">
          Game Play between {battle.createdBy?.name || "Player"} &{" "}
          {battle.opponent?.name || "Opponent"}
        </h3>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-4 py-4">
        <div>
          <p className="text-base font-semibold text-white/90">Entry Fee</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-black">
            💸 {battle.amount}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-black text-[#4f4394] shadow-lg">
            VS
          </div>
        </div>

        <div className="text-right">
          <p className="text-base font-semibold text-white/90">Winning Prize</p>
          <p className="mt-1 flex items-center justify-end gap-2 text-3xl font-black">
            💸 {battle.prize || calculatePrize(battle.amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PendingCard({ battle, calculatePrize, onClick }) {
  const status = String(battle?.status || "").toLowerCase();

  return (
    <div
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded-lg border border-yellow-300 bg-[#fff2b8] text-black shadow-md"
    >
      <div className="border-b border-black/20 px-4 py-3">
        <h3 className="text-xl font-black">
          Pending Result: {battle.createdBy?.name || "Player"} &{" "}
          {battle.opponent?.name || "Opponent"}
        </h3>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-4 py-4">
        <div>
          <p className="text-base font-semibold text-slate-800">Entry Fee</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-black">
            💸 {battle.amount}
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto rounded-full bg-yellow-500 px-3 py-2 text-[11px] font-black uppercase text-white shadow">
            {status === "cancel_requested" ? "Cancel Wait" : "Result Wait"}
          </div>
        </div>

        <div className="text-right">
          <p className="text-base font-semibold text-slate-800">Winning Prize</p>
          <p className="mt-1 flex items-center justify-end gap-2 text-3xl font-black">
            💸 {battle.prize || calculatePrize(battle.amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Battle;