import React, { useEffect, useState, memo } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fast dynamic styles tracking lookup map
const STATUS_STYLES = {
  approved: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cardBg: "bg-gradient-to-r from-emerald-50/30 to-white",
    sideBorder: "border-l-4 border-l-emerald-500",
    prizeColor: "text-emerald-600"
  },
  rejected: {
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    cardBg: "bg-gradient-to-r from-rose-50/30 to-white",
    sideBorder: "border-l-4 border-l-rose-500",
    prizeColor: "text-rose-600"
  },
  cancelled: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    cardBg: "bg-white",
    sideBorder: "border-l-4 border-l-slate-300",
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
  cardBg: "bg-gradient-to-r from-blue-50/20 to-white",
  sideBorder: "border-l-4 border-l-blue-500",
  prizeColor: "text-blue-600"
};

// Memoized Match Row for ultra-fast list rendering
const BattleRow = memo(({ battle }) => {
  const mode = STATUS_STYLES[battle.status] || DEFAULT_STYLE;

  return (
    <div className={`rounded-xl border border-gray-150 p-3 shadow-sm transition-all hover:shadow-md ${mode.cardBg} ${mode.sideBorder}`}>
      {/* Top Details Header Line */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-gray-900">
            Battle ₹{battle.amount}
          </h2>
          <p className="text-[11px] font-bold text-gray-400 tracking-tight">
            ID: {battle.battleId}
          </p>
        </div>

        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${mode.badge}`}>
          {battle.status?.replace("_", " ")}
        </span>
      </div>

      {/* Row Minimal Data Elements Grid */}
      <div className="mt-2.5 grid grid-cols-3 gap-2 border-b border-gray-100 pb-2.5 text-center">
        <div className="rounded-lg bg-gray-50/80 py-1.5 border border-gray-100/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Entry</p>
          <h3 className="text-sm font-black text-slate-800">₹{battle.amount}</h3>
        </div>

        <div className="rounded-lg bg-gray-50/80 py-1.5 border border-gray-100/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Prize</p>
          <h3 className={`text-sm font-black ${mode.prizeColor}`}>₹{battle.prize}</h3>
        </div>

        <div className="rounded-lg bg-gray-50/80 py-1.5 border border-gray-100/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Room Code</p>
          <h3 className="text-sm font-black text-indigo-600 select-all tracking-wide">
            {battle.ludoKingRoomCode || "——"}
          </h3>
        </div>
      </div>

      {/* Bottom Compact Horizontal Player Info Panel */}
      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-gray-600">
        <div className="truncate pr-1">
          <span className="text-gray-400">C:</span> <span className="text-slate-700">{battle.createdBy?.name || "Player"}</span>
          <span className="mx-1.5 text-gray-300">|</span> 
          <span className="text-gray-400">O:</span> <span className="text-slate-700">{battle.opponent?.name || "Waiting"}</span>
        </div>
        <div className="shrink-0 text-right text-gray-400 font-medium">
          {battle.createdAt ? new Date(battle.createdAt).toLocaleDateString("en-IN", {hour: '2-digit', minute:'2-digit'}) : ""}
        </div>
      </div>

      {battle.winner?.name && (
        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
          <span>🏆</span> <span>Winner: <b>{battle.winner.name}</b></span>
        </div>
      )}
    </div>
  );
});

export default function History() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE}/battle/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBattles(res.data.battles || []);
    } catch (err) {
      console.log("History load error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-3 pt-16 pb-24 font-sans">
      <div className="mx-auto max-w-[480px]">
        
        {/* Header Block LIGHT Minimalist Banner As Requested */}
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 p-4 text-slate-800 border border-slate-200/60 shadow-sm">
          <h1 className="text-xl font-black tracking-tight text-slate-900">Match History</h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Your recent battlefield logs and performance metrics.
          </p>
        </div>

        {/* Dynamic Display Logic Flow */}
        {loading ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm border border-gray-100">
            ⏳ Syncing match records...
          </div>
        ) : battles.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
            <span className="text-3xl">⚔️</span>
            <h2 className="text-base font-black text-slate-800 mt-2">
              No match history found
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-400">
              Battle play karne ke baad history yaha show hogi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {battles.map((battle) => (
              <BattleRow key={battle._id} battle={battle} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
