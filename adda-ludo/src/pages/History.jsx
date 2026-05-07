import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function History() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStatusStyle = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    if (status === "cancelled") return "bg-gray-100 text-gray-700";
    if (status === "result_submitted") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/battle/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBattles(res.data.battles || []);
    } catch (err) {
      console.log("History error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "History load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 pt-20 pb-28">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-5 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white shadow-xl">
          <h1 className="text-2xl font-black">Match History</h1>
          <p className="mt-1 text-sm text-white/70">
            Your completed, running, cancelled and submitted battles.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center font-bold shadow">
            Loading history...
          </div>
        ) : battles.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow">
            <h2 className="text-xl font-black text-gray-800">
              No match history found
            </h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Battle play karne ke baad history yaha show hogi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {battles.map((battle) => (
              <div
                key={battle._id}
                className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      Battle ₹{battle.amount}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      ID: {battle.battleId}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${getStatusStyle(
                      battle.status
                    )}`}
                  >
                    {battle.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs font-bold text-gray-500">Entry</p>
                    <h3 className="text-lg font-black">₹{battle.amount}</h3>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs font-bold text-gray-500">Prize</p>
                    <h3 className="text-lg font-black text-green-600">
                      ₹{battle.prize}
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs font-bold text-gray-500">Room</p>
                    <h3 className="text-lg font-black">
                      {battle.ludoKingRoomCode || "-"}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-gray-700">
                  <p>
                    Creator: {battle.createdBy?.name || "Player"}
                  </p>
                  <p>
                    Opponent: {battle.opponent?.name || "Waiting"}
                  </p>
                  <p>
                    Winner: {battle.winner?.name || "Not decided"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {battle.createdAt
                      ? new Date(battle.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}