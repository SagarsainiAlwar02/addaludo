import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

function calculatePrize(amount) {
  const totalPool = Number(amount) * 2;
  const commissionPercentPerUser = Number(amount) <= 500 ? 5 : 2.5;
  const commission = Math.floor((totalPool * commissionPercentPerUser * 2) / 100);
  return totalPool - commission;
}

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user?._id || user?.id) {
      return String(user._id || user.id);
    }

    const token = localStorage.getItem("token");
    if (!token) return "";

    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(
      payload?._id ||
        payload?.id ||
        payload?.userId ||
        payload?.user ||
        ""
    );
  } catch {
    return "";
  }
}

function getBattleCreatorId(battle) {
  return String(
    battle?.createdBy?._id ||
      battle?.createdBy?.id ||
      battle?.createdBy ||
      battle?.creator?._id ||
      battle?.creator?.id ||
      battle?.creator ||
      battle?.user?._id ||
      battle?.user?.id ||
      battle?.user ||
      battle?.userId ||
      ""
  );
}

export default function Battle() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [openBattles, setOpenBattles] = useState([]);
  const [myBattles, setMyBattles] = useState([]);
  const [loading, setLoading] = useState(false);

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
    const interval = setInterval(fetchBattles, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createBattle = async () => {
    if (!validateAmount(amount)) return;

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/battle/create`,
        { amount: Number(amount) },
        authHeader()
      );

      setAmount("");
      await fetchBattles();

      alert("Battle open ho gayi");
    } catch (err) {
      alert(err.response?.data?.msg || "Battle create failed");
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async (battleId) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/battle/join/${battleId}`,
        {},
        authHeader()
      );

      const joinedId = res.data?.battle?.battleId || battleId;

      await fetchBattles();
      navigate(`/room-code/${joinedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Battle join failed");
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
      alert("Battle cancelled aur amount refund ho gaya");
    } catch (err) {
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  const visibleOpenBattles = useMemo(() => {
    const map = new Map();

    [...openBattles, ...myBattles].forEach((battle) => {
      if (
        battle?.battleId &&
        ["open", "waiting"].includes(String(battle.status || "").toLowerCase())
      ) {
        map.set(battle.battleId, battle);
      }
    });

    return Array.from(map.values());
  }, [openBattles, myBattles]);

  const runningBattles = useMemo(() => {
    return myBattles.filter((b) =>
      [
        "running",
        "room_submitted",
        "result_submitted",
        "loss_submitted",
        "cancel_requested",
      ].includes(b.status)
    );
  }, [myBattles]);

  const historyBattles = useMemo(() => {
    return myBattles.filter((b) =>
      ["approved", "rejected", "cancelled"].includes(b.status)
    );
  }, [myBattles]);

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
            <div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
              Min ₹50, max ₹100000, amount ₹50 ke multiple me hona chahiye
            </div>

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
              disabled={loading}
              onClick={createBattle}
              className="w-full rounded-xl bg-gradient-to-b from-red-500 to-red-700 py-3 font-black text-white disabled:opacity-60"
            >
              Set Amount
            </button>
          </div>
        </div>

        <SectionTitle title="🔥 Open Battles" />

        {visibleOpenBattles.length === 0 ? (
          <EmptyBox text="Abhi koi open battle nahi hai" />
        ) : (
          visibleOpenBattles.map((battle) => {
            const creatorId = getBattleCreatorId(battle);
            const isMine = creatorId && myId && creatorId === myId;

            return (
              <BattleCard
                key={battle.battleId}
                battle={battle}
                action={
                  isMine ? (
                    <button
                      disabled={loading}
                      onClick={() => cancelOpenBattle(battle.battleId)}
                      className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={() => joinBattle(battle.battleId)}
                      className="rounded-xl bg-green-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
                    >
                      Play
                    </button>
                  )
                }
              />
            );
          })
        )}

        <SectionTitle title="🏃 Running Battles" />

        {runningBattles.length === 0 ? (
          <EmptyBox text="Abhi koi running battle nahi hai" />
        ) : (
          runningBattles.map((battle) => (
            <BattleCard
              key={battle.battleId}
              battle={battle}
              dark
              action={
                <button
                  onClick={() => navigate(`/room-code/${battle.battleId}`)}
                  className="rounded-xl bg-white px-5 py-2 text-sm font-black text-blue-700"
                >
                  View
                </button>
              }
            />
          ))
        )}

        <SectionTitle title="📜 Battle History" />

        {historyBattles.length === 0 ? (
          <EmptyBox text="History empty hai" />
        ) : (
          historyBattles.map((battle) => (
            <BattleCard
              key={battle.battleId}
              battle={battle}
              action={
                <button
                  onClick={() => navigate(`/room-code/${battle.battleId}`)}
                  className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-black text-white"
                >
                  View
                </button>
              }
            />
          ))
        )}
      </div>
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
        {battle.createdBy?.name ||
          battle.creator?.name ||
          battle.user?.name ||
          "Player"}{" "}
        vs {battle.opponent?.name || "Waiting..."}
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

      <div
        className={`px-4 pb-3 text-xs font-bold ${
          dark ? "text-white/70" : "text-slate-500"
        }`}
      >
        Status: {battle.status}
      </div>
    </div>
  );
}