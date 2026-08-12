import React, { useEffect, useState, memo } from "react";
import api, { getData, getError } from "../api.js";

// Status-wise dynamic styles & border colors
const STATUS_STYLES = {
  approved: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cardBg: "bg-gradient-to-r from-emerald-50/20 to-white",
    sideBorder: "border-l-4 border-l-emerald-500",
    prizeColor: "text-emerald-600"
  },
  rejected: {
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    cardBg: "bg-gradient-to-r from-rose-50/20 to-white",
    sideBorder: "border-l-4 border-l-rose-500",
    prizeColor: "text-rose-600"
  },
  cancelled: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    cardBg: "bg-slate-50/50",
    sideBorder: "border-l-4 border-l-slate-400",
    prizeColor: "text-slate-400"
  },
  result_submitted: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    cardBg: "bg-gradient-to-r from-amber-50/20 to-white",
    sideBorder: "border-l-4 border-l-amber-500",
    prizeColor: "text-amber-600"
  }
};

const DEFAULT_STYLE = {
  badge: "bg-blue-100 text-blue-800 border-blue-200",
  cardBg: "bg-white",
  sideBorder: "border-l-4 border-l-blue-500",
  prizeColor: "text-blue-600"
};

// Compact Match Row Component
const BattleRow = memo(({ battle, currentUserId }) => {
  const mode = STATUS_STYLES[battle.status] || DEFAULT_STYLE;

  // Correct Win / Loss / Cancelled Badge Logic
  let resultBadge = null;

  if (battle.status === "cancelled") {
    resultBadge = (
      <span className="bg-slate-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
        🚫 CANCELLED
      </span>
    );
  } else if (battle.winner) {
    const winnerId = typeof battle.winner === "object" ? battle.winner._id : battle.winner;
    const isWinner = winnerId && currentUserId && String(winnerId) === String(currentUserId);

    if (isWinner) {
      resultBadge = (
        <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
          🏆 WON
        </span>
      );
    } else {
      resultBadge = (
        <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
          ❌ LOST
        </span>
      );
    }
  }

  return (
    <div className={`rounded-lg border border-slate-200/70 p-2.5 shadow-sm transition-all hover:shadow ${mode.cardBg} ${mode.sideBorder}`}>
      {/* Header Line */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex items-center gap-1.5">
          <h2 className="truncate text-xs font-black text-slate-900">
            Battle ₹{battle.amount}
          </h2>
          <span className="text-[10px] font-bold text-slate-400">
            #{battle.battleId?.slice(-6)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {resultBadge}
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border ${mode.badge}`}>
            {battle.status?.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded bg-slate-100/70 py-1 border border-slate-200/40">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Entry</p>
          <h3 className="text-xs font-black text-slate-800">₹{battle.amount}</h3>
        </div>

        <div className="rounded bg-slate-100/70 py-1 border border-slate-200/40">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Prize</p>
          <h3 className={`text-xs font-black ${mode.prizeColor}`}>₹{battle.prize}</h3>
        </div>

        <div className="rounded bg-slate-100/70 py-1 border border-slate-200/40">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Room Code</p>
          <h3 className="text-xs font-black text-indigo-600 select-all tracking-wide">
            {battle.ludoKingRoomCode || "——"}
          </h3>
        </div>
      </div>

      {/* Player Details Horizontal Strip */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-600">
        <div className="truncate pr-1">
          <span className="text-slate-400">C:</span> <span className="text-slate-800">{battle.createdBy?.name || "Player"}</span>
          <span className="mx-1 text-slate-300">vs</span> 
          <span className="text-slate-400">O:</span> <span className="text-slate-800">{battle.opponent?.name || "Waiting"}</span>
        </div>
        <div className="shrink-0 text-slate-400 font-semibold text-[9px]">
          {battle.createdAt ? new Date(battle.createdAt).toLocaleDateString("en-IN", { hour: '2-digit', minute: '2-digit' }) : ""}
        </div>
      </div>

      {/* Winner Name Footer */}
      {battle.winner?.name && (
        <div className="mt-1.5 rounded bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center justify-between">
          <span>Winner: <b>{battle.winner.name}</b></span>
          <span className="text-[9px] text-emerald-600">Verified</span>
        </div>
      )}
    </div>
  );
});

export default function History() {
  const [battles, setBattles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (!localStorage.getItem("token")) return;

      // 1. Fetch Profile to get logged in User ID accurately
      try {
        const profileRes = await api.get("/user/profile");
        const profileData = getData(profileRes);
        const uId = profileData?.user?._id || profileData?._id;
        if (uId) setCurrentUserId(uId);
      } catch (e) {
        console.log("Profile ID fetch error:", e);
      }

      // 2. Fetch Contests
      const res = await api.get("/contests/my-contests");
      const data = getData(res);

      const allMatches = (data?.contests || []).map((c) => ({
        ...c,
        battleId: c.contestId,
        amount: c.entryFee,
      }));

      const filteredMatches = allMatches.filter(battle => {
        if (battle.status === "cancelled" && !battle.opponent) {
          return false;
        }
        return true;
      });

      setBattles(filteredMatches);
    } catch (err) {
      console.log("History load error:", getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-2.5 pt-14 pb-20 font-sans">
      <div className="mx-auto max-w-[420px]">
        
        {/* Header Block */}
        <div className="mb-2.5 rounded-xl bg-white p-3 text-slate-800 border border-slate-200/80 shadow-sm">
          <h1 className="text-base font-black tracking-tight text-slate-900">Match History</h1>
          <p className="text-[11px] font-medium text-slate-500">
            Aapki sabhi khele gaye matches ki details.
          </p>
        </div>

        {/* Display Logic */}
        {loading ? (
          <div className="rounded-lg bg-white p-4 text-center text-xs font-bold text-slate-500 shadow-sm border border-slate-100">
            ⏳ Syncing match records...
          </div>
        ) : battles.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm border border-slate-100">
            <span className="text-2xl">⚔️</span>
            <h2 className="text-sm font-black text-slate-800 mt-1">
              No match history found
            </h2>
            <p className="mt-0.5 text-[11px] font-bold text-slate-400">
              Battle play karne ke baad history yaha show hogi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {battles.map((battle) => (
              <BattleRow key={battle._id} battle={battle} currentUserId={currentUserId} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
