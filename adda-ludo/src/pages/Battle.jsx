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
    // Slab 1: total commission = 10% of the bet (5% per user)
    platformFee = amt * 0.1;
  } else if (amt > 500 && amt <= 100000) {
    // Slab 2: total commission = 5% of the bet (2.5% per user)
    platformFee = amt * 0.05;
  }

  return Math.floor(totalPool - platformFee);
};

const FAKE_PLAYER_NAMES = [
  "rocky", "khatu", "Player 59", "Sohan", "Player 145",
  "Player 156", "Player 167", "Player 178", "Player 189", "Player 190",
  "Player 201", "Player 212", "Player 223", "Player 234", "Player 245",
  "Player 256", "Player 267", "Player 278", "Player 289", "Player 300",
];

const FAKE_OPPONENT_NAMES = [
  "Player 311", "Player 322", "aao koi", "Player 344", "Player 355",
  "Player 366", "Player 377", "Player 388", "Player 399", "Player 410",
  "Player 421", "Player 432", "Player 443", "Player 454", "Player 465",
  "Player 476", "Player 487", "Player 498", "Player 509", "Player 520",
];

const FAKE_BATTLE_AMOUNTS = [
  2500, 6800, 500, 2000, 250, 750, 3050, 4000, 100, 1450, 3250, 2050, 1500, 600, 2000, 200, 100, 2250, 150, 7000, 5500, 950, 50, 1050
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const FAKE_RUNNING_AMOUNTS = FAKE_BATTLE_AMOUNTS.slice(0, 25);

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

    // User's own battles (the ones showing the VIEW button) always go on top;
    // other players' battles follow below. Within each group keep newest first.
    realRunningAndPendingBattles.sort((a, b) => {
      const aMine = getCreatorId(a) === myId || getOpponentId(a) === myId;
      const bMine = getCreatorId(b) === myId || getOpponentId(b) === myId;

      if (aMine !== bMine) return aMine ? -1 : 1;

      return (
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
      );
    });

    return [...realRunningAndPendingBattles, ...FAKE_RUNNING_BATTLES];
  }, [allBattles, myId]);

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
      // Dummy (admin social-proof) contest: it just disappears, no notification.
      if (err?.response?.data?.code === "DUMMY_CONTEST") {
        fetchBattles();
        return;
      }

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
        <div className="mb-4 mt-2 text-[12px] text-white px-5 py-3 overflow-hidden rounded-lg bg-black shadow-md">
          {/* <div className="flex items-center justify-center pt-1 pb-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100">
              Adda Ludo
            </p>
          </div> */}

            ADDA LUDO में आपका स्वागत है, 1 दिन क लिए Support no☎️ change  कर दिया गया हैं (Fast withdrawal ⏩)

          {/* <div className="mt-1 rounded-xl bg-black/30 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-white ring-1 ring-white/10 shadow-inner">
            ADDA LUDO में आपका स्वागत है,1 दिन क लिए Support no☎️ change  कर दिया गया हैं
          </div> */}
        </div>
        <div className="w-full flex justify-center">
          <h2 className="text-base font-bold">Create Battle</h2>
        </div>

        <div className="mb-5 mx-10 rounded-[50px] bg-white shadow-md ring-1 ring-slate-200">
          {/* <div className="mb-3 flex items-center justify-between">

            <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Rules
            </button>
          </div> */}

          <div className="flex rounded-[50px] items-center gap-2 bg-white p-2 ring-1 ring-slate-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-base font-semibold">
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
              className="rounded-md bg-slate-900 mr-2 px-4 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-60"
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

        <div className="h-[3px] rounded-full bg-gray-500 mt-4"></div>

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
    <div className="mb-2 mt-3 flex items-center justify-start gap-1.5 px-1">
      <h3 className="text-[15px] font-black uppercase tracking-wide text-slate-800">
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
      <div className="bg-gray-200 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-semibold text-gray-600">Challenge From</h3>
          <h3 className="truncate text-[12px] font-bold text-slate-900">
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

  const isMine = getCreatorId(battle) === myId;
  const isOpponent = getOpponentId(battle) === myId;

  const isParticipant = !battle?.isFake && (isMine || isOpponent);

  const creatorName = battle?.createdBy?.name || "Player";
  const opponentName = battle?.opponent?.name || "Opponent";
  const amount = battle?.amount || 0;
  const prize = battle?.prize || calculatePrize(battle?.amount);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-xl bg-white shadow-md ring-1 transition active:scale-[0.99] ${isPending ? "ring-orange-200" : "ring-slate-200"
        }`}
    >
      {/* Top band — Playing For | Prize */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gray-200 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            Playing For
          </span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-[10px] font-black text-white shadow-sm">
            ₹
          </span>
          <span className="truncate text-xs font-bold text-slate-900">{amount}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            Prize
          </span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-[10px] font-black text-white shadow-sm">
            ₹
          </span>
          <span className="truncate text-xs font-bold text-slate-900">{prize}</span>
        </div>
      </div>

      {/* Players facing off */}
      <div className="flex items-center justify-between gap-2 px-8 py-2">
        <PlayerAvatar name={creatorName} />

        <div className="flex shrink-0 items-center justify-center">
          {isParticipant ? (
            isPending ? (
              <button className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md shadow-orange-500/20 active:scale-95">
                Pending
              </button>
            ) : (
              <button className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md shadow-indigo-500/25 active:scale-95">
                VIEW
              </button>
            )
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#242b56] shadow-inner ring-2 ring-white/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
              >
                <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                <line x1="13" x2="19" y1="19" y2="13" />
                <line x1="16" x2="20" y1="16" y2="20" />
                <line x1="19" x2="21" y1="21" y2="19" />
                <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
                <line x1="5" x2="9" y1="14" y2="18" />
                <line x1="7" x2="4" y1="17" y2="20" />
                <line x1="3" x2="5" y1="19" y2="21" />
              </svg>
            </div>
          )}
        </div>

        <PlayerAvatar name={opponentName} />
      </div>
    </div>
  );
}

function PlayerAvatar({ name }) {
  const safeName = String(name || "Player").trim() || "Player";

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-indigo-50 shadow ring-2 ring-white">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(safeName)}`}
          alt={safeName}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="w-full truncate text-center text-[10px] font-bold text-slate-800">
        {safeName}
      </p>
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
