import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getData, getError } from "../api.js";

export default function ReferHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      if (!localStorage.getItem("token")) {
        setError("Please login again");
        return;
      }

      const res = await api.get("/user/referral-history");
      const data = getData(res);
      setHistory(data?.history || []);
    } catch (err) {
      console.log("Referral history fetch error:", err);
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-3 pt-16 pb-24 font-sans">
      <div className="mx-auto max-w-[480px]">

        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/refer")}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">
            Refer History
          </h1>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 text-center">
            {error}
          </p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-200 border-t-cyan-500 rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-bold text-slate-400">Loading history...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && history.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 text-xl mx-auto mb-3">
              <i className="fa-solid fa-inbox"></i>
            </div>
            <p className="text-sm font-bold text-slate-400">No referral earnings yet</p>
            <p className="text-xs text-slate-300 mt-1">
              Share your referral code and earn when your friends win!
            </p>
          </div>
        )}

        {/* History list */}
        {!loading && history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_90px_90px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                Player Name
              </p>
              <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase text-right">
                Earned
              </p>
              <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase text-right">
                Balance
              </p>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
              {history.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="grid grid-cols-[1fr_90px_90px] gap-2 px-4 py-3 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {item.playerName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-green-600 text-right">
                    +₹{Number(item.amount || 0).toFixed(0)}
                  </p>
                  <p className="text-sm font-bold text-slate-500 text-right">
                    ₹{Number(item.balanceAfter || 0).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
