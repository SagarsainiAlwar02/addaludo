import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";
import socket from "../socket.js";

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

const FAKE_PLAYER_NAMES = [
  "Player 101", "Rohit", "Player 59", "Sohan", "Player 145",
  "Player 156", "Player 167", "Player 178", "Player 189", "Player 190",
  "Player 201", "Player 212", "Player 223", "Player 234", "Player 245",
  "Player 256", "Player 267", "Player 278", "Player 289", "Player 300",
];

const FAKE_OPPONENT_NAMES = [
  "Player 311", "Player 322", "Player 333", "Player 344", "Player 355",
  "Player 366", "Player 377", "Player 388", "Player 399", "Player 410",
  "Player 421", "Player 432", "Player 443", "Player 454", "Player 465",
  "Player 476", "Player 487", "Player 498", "Player 509", "Player 520",
];

const FAKE_BATTLE_AMOUNTS = [
  1600, 500, 1000, 200, 350, 4000, 100, 1450, 3250, 2050, 1500, 600, 2000, 200, 100, 2250, 150, 7000, 5500, 950, 50, 1050
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const FAKE_RUNNING_AMOUNTS = FAKE_BATTLE_AMOUNTS.slice(0, 18);

const FAKE_RUNNING_BATTLES = FAKE_RUNNING_AMOUNTS.map((amount, index) => {
  const creatorName = randomFrom(FAKE_PLAYER_NAMES);
  let opponentName = randomFrom(FAKE_OPPONENT_NAMES);

  if (opponentName === creatorName) {
    opponentName = `${opponentName} Jr.`;
  }

  return {
    battleId: `fake_run_${index + 1}`,
    amount,
    prize: calculatePrizeAmount(amount),
    status: "running",
    isFake: true,
    createdBy: { name: creatorName },
    opponent: { name: opponentName },
  };
});

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

  const calculatePrize = useCallback((amount) => calculatePrizeAmount(amount), []);

  const hasMyResult = useCallback(
    (battle) =>
      Array.isArray(battle?.results)
        ? battle.results.some((item) => String(item?.user?._id || item?.user || "") === myId)
        : false,
    [myId]
  );

  const mapContest = (c) => ({
    ...c,
    battleId: c.contestId,
    amount: c.entryFee,
    createdBy: c.createdBy,
    opponent: c.opponent,
  });

  const fetchBattles = useCallback(async () => {
    if (!token) return;

    try {
      const openRes = await api.get("/contests/open");
      const openData = getData(openRes);
      setOpenBattles(Array.isArray(openData?.contests) ? openData.contests.map(mapContest) : []);

      const myRes = await api.get("/contests/my-contests");
      const myData = getData(myRes);
      setMyBattles(Array.isArray(myData?.contests) ? myData.contests.map(mapContest) : []);
    } catch (err) {
      console.log("Fetch error:", getError(err));
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBattles();

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-open-contests");

    const handleContestUpdate = () => {
      fetchBattles();
    };

    socket.on("contest-created", handleContestUpdate);
    socket.on("contest-updated", handleContestUpdate);
    socket.on("contest-deleted", handleContestUpdate);

    return () => {
      socket.off("contest-created", handleContestUpdate);
      socket.off("contest-updated", handleContestUpdate);
      socket.off("contest-deleted", handleContestUpdate);
    };
  }, [token, navigate, myId, fetchBattles]);

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
    const realRunningAndPendingBattles = [];

    for (const battle of allBattles) {
      const status = String(battle?.status || "").toLowerCase();

      if (
        status === "running" ||
        status === "room_submitted" ||
        status === "result_submitted" ||
        status === "cancel_requested"
      ) {
        realRunningAndPendingBattles.push(battle);
      }
    }

    realRunningAndPendingBattles.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );

    return [...realRunningAndPendingBattles, ...FAKE_RUNNING_BATTLES];
  }, [allBattles]);

  const validateAmount = () => {
    const amt = Number(betAmount);

    if (!amt || amt < 50) {
      alert("Min battle ₹50 ");
      return false;
    }

    if (amt > 100000) {
      alert("Max battle ₹100000");
      return false;
    }

    if (amt % 50 !== 0) {
      alert("Amount in Multiple ₹50 ");
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateAmount()) return;

    if (myActiveBattle) {
      alert("You already in game ");
      return;
    }

    if (mySearchingBattles.length >= MAX_SEARCHING_BATTLES) {
      alert("set only 2 battle ");
      return;
    }

    const amt = Number(betAmount);

    // SINGLE USER SAME AMOUNT VALIDATION
    // Check if the current user already has an active open battle with the exact same amount
    const isSameAmountByMe = mySearchingBattles.some(
      (battle) => Number(battle.amount) === amt
    );

    if (isSameAmountByMe) {
      alert("no same amount");
      return;
    }

    try {
      setActionLoading(true);
      await api.post("/contests/create", { amount: amt });
      setBetAmount("");
      fetchBattles();
    } catch (err) {
      const errMsg = getError(err).toLowerCase();
      if (errMsg.includes("insufficient") || errMsg.includes("balance") || errMsg.includes("fund")) {
        alert("Insufficient balance");
      } else {
        alert(getError(err));
      }
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
      await api.post(`/contests/join/${battleId}`);

      fetchBattles();
      navigate(`/room-code/${battleId}`);
    } catch (err) {
      const errMsg = getError(err).toLowerCase();
      if (errMsg.includes("insufficient") || errMsg.includes("balance") || errMsg.includes("fund")) {
        alert("Insufficient balance");
      } else {
        alert(getError(err));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const startBattle = async (battleId) => {
    try {
      setActionLoading(true);
      await api.post(`/contests/accept/${battleId}`);

      fetchBattles();
      navigate(`/room-code/${battleId}`);
    } catch (err) {
      console.log("Start error:", getError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const rejectBattle = async (battleId) => {
    try {
      setActionLoading(true);
      await api.post(`/contests/reject/${battleId}`);
      fetchBattles();
    } catch (err) {
      console.log("Reject error:", getError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const cancelBattle = async (battleId) => {
    try {
      setActionLoading(true);
      await api.post(`/contests/cancel/${battleId}`);
      fetchBattles();
    } catch (err) {
      console.log("Cancel error:", getError(err));
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
          className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 active:scale-95 disabled:opacity-50"
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
          className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-green-500/20 active:scale-95 disabled:opacity-50"
        >
          PLAY
        </button>
      );
    }

    if (status === "join_requested" && isMine) {
      return (
        <div className="flex items-center gap-1.5">
          <button
            disabled={actionLoading}
            onClick={() => startBattle(battle.battleId)}
            className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm disabled:opacity-50"
          >
            START
          </button>

          <button
            disabled={actionLoading}
            onClick={() => rejectBattle(battle.battleId)}
            className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm disabled:opacity-50"
          >
            REJECT
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isOpponent) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-500" />
            <p className="text-[10px] font-bold text-slate-500">WAITING</p>
          </div>

          <button
            disabled={actionLoading}
            onClick={() => cancelBattle(battle.battleId)}
            className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-bold text-white active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button disabled className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">
        BUSY
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#eef3ff] px-3 pb-28 pt-14 text-slate-950">
      <div className="mx-auto max-w-md">
        {/* Banner Box */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#202b65] to-[#06b6d4] p-2 shadow-md">
          <div className="flex items-center justify-center pt-1 pb-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100">
              Adda Ludo
            </p>
          </div>

          <div className="mt-1 rounded-xl bg-black/30 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-white ring-1 ring-white/10 shadow-inner">
            ADDA LUDO में आपका स्वागत है, सबसे Fast ⏩ विथड्रॉ है, 👉 मात्र 2-3 Min में, 👈 आपका विश्वास बनाये रखे 🙏 
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Create Battle</h2>
              <p className="text-[11px] font-medium text-slate-400">
              
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

        <SectionTitle title="Open Battles" />

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

        <SectionTitle title="Running Battles" />

        <div className="space-y-4">
          {runningBattles.length === 0 && <EmptyBox text="No Running Battles" />}

          {runningBattles.map((battle) => (
            <MatchCard
              key={battle.battleId}
              battle={battle}
              calculatePrize={calculatePrize}
              myId={myId}
              onClick={() => {
                if (battle.isFake) return;
                navigate(`/room-code/${battle.battleId}`);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function SectionTitle({ title }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-start gap-1.5 px-1">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">
        {title}
      </h3>
      <span className="text-sm">⚔️</span>
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
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500">Challenge From</p>
          <h3 className="truncate text-sm font-bold text-slate-900">
            {battle?.createdBy?.name || "Player"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-3 py-2.5">
        <MoneyBlock label="Entry Fee" value={battle?.amount} />

        <div className="flex justify-center shrink-0">
          {action}
        </div>

        <MoneyBlock label="Winning" value={battle?.prize || calculatePrize(battle?.amount)} right />
      </div>
    </div>
  );
}

function MatchCard({ battle, calculatePrize, onClick, myId }) {
  if (!battle) return null;

  const status = String(battle?.status || "").toLowerCase();
  const isPending = status === "result_submitted" || status === "cancel_requested";

  const isMine =
    String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "") === myId;

  const isOpponent =
    String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "") === myId;

  const isParticipant = !battle?.isFake && (isMine || isOpponent);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-xl bg-white shadow-md ring-1 active:scale-[0.99] ${
        isPending ? "ring-orange-300 bg-orange-50/20" : "ring-indigo-200"
      }`}
    >
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">
            {isPending ? "Result Waiting" : "Running Battle"}
          </p>

          <h3 className="truncate text-sm font-bold text-slate-900">
            {battle?.createdBy?.name || "Player"} VS {battle?.opponent?.name || "Opponent"}
          </h3>
        </div>

        <div
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
            isPending ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
          }`}
        >
          {isPending ? "Pending" : "Live"}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-3 py-2.5">
        <MoneyBlock label="Entry Fee" value={battle?.amount} />

        <div className="flex justify-center shrink-0">
          {isParticipant ? (
            isPending ? (
              <button className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-orange-500/20 active:scale-95 uppercase">
                Pending
              </button>
            ) : (
              <button className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-indigo-500/20 active:scale-95 uppercase">
                VIEW
              </button>
            )
          ) : (
            <div className="flex h-8 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-[11px] font-bold text-white shadow-sm">
              VS
            </div>
          )}
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
