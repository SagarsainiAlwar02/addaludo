import React, { useEffect, useState, memo } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fast dynamic styles tracking lookup map
const STATUS_MAP = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  result_submitted: "bg-yellow-100 text-yellow-700"
};

// Memoized Match Row for ultra-fast list rendering
const BattleRow = memo(({ battle }) => {
  const statusStyle = STATUS_MAP[battle.status] || "bg-blue-100 text-blue-700";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      {/* Top Details Header Line */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-gray-900">
            Battle ₹{battle.amount}
          </h2>
          <p className="text-[11px] font-bold text-gray-400">
            ID: {battle.battleId}
          </p>
        </div>

        <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide shrink-0 ${statusStyle}`}>
          {battle.status?.replace("_", " ")}
        </span>
      </div>

      {/* Row Minimal Data Elements Grid */}
      <div className="mt-2.5 grid grid-cols-3 gap-2 border-b border-gray-50 pb-2.5 text-center">
        <div className="rounded-lg bg-gray-50/70 py-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Entry</p>
          <h3 className="text-sm font-black text-slate-800">₹{battle.amount}</h3>
        </div>

        <div className="rounded-lg bg-gray-50/70 py-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Prize</p>
          <h3 className="text-sm font-black text-green-600">₹{battle.prize}</h3>
        </div>

        <div className="rounded-lg bg-gray-50/70 py-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Room</p>
          <h3 className="text-sm font-black text-indigo-600 select-all">
            {battle.ludoKingRoomCode || "——"}
          </h3>
        </div>
      </div>

      {/* Bottom Compact Horizontal Player Info Panel */}
      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-gray-600">
        <div className="truncate pr-1">
          <span className="text-gray-400">C:</span> {battle.createdBy?.name || "Player"} 
          <span className="mx-1.5 text-gray-300">|</span> 
          <span className="text-gray-400">O:</span> {battle.opponent?.name || "Waiting"}
        </div>
        <div className="shrink-0 text-right text-gray-400 font-medium">
          {battle.createdAt ? new Date(battle.createdAt).toLocaleDateString("en-IN", {hour: '2-digit', minute:'2-digit'}) : ""}
        </div>
      </div>

      {battle.winner?.name && (
        <div className="mt-1.5 rounded bg-emerald-50/60 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
          🏆 Winner: {battle.winner.name}
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
        
        {/* Header Block Gradient Banner */}
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-sm">
          <h1 className="text-xl font-black tracking-tight">Match History</h1>
          <p className="mt-0.5 text-xs text-slate-400">
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
