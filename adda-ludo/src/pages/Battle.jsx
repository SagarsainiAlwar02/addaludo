import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const MAX_SEARCHING_BATTLES = 2;

function calculatePrize(amount) {
  const amt = Number(amount);
  const totalPool = amt * 2;
  const commissionPercent = amt <= 500 ? 5 : 2.5;
  const commission = Math.floor((totalPool * commissionPercent) / 100);
  return totalPool - commission;
}

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?._id || user?.id) return String(user._id || user.id);

    const token = localStorage.getItem("token");
    if (!token) return "";

    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(payload?._id || payload?.id || payload?.userId || payload?.user || "");
  } catch {
    return "";
  }
}

function getCreatorId(battle) {
  return String(battle?.createdBy?._id || battle?.createdBy?.id || battle?.createdBy || "");
}

function getOpponentId(battle) {
  return String(battle?.opponent?._id || battle?.opponent?.id || battle?.opponent || "");
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
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
      return [
        "join_requested",
        "running",
        "room_submitted",
        "cancel_requested",
        "result_submitted",
      ].includes(status);
    });
  }, [myBattles]);

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

  const validateAmount = () => {
    const value = Number(amount);

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

  const createBattle = async () => {
    if (!validateAmount()) return;

    if (myActiveBattle) {
      alert("Aapki ek battle already chal rahi hai. Pehle uska result update karo.");
      return;
    }

    if (mySearchingBattles.length >= MAX_SEARCHING_BATTLES) {
      alert("Searching me maximum 2 battle hi create kar sakte ho.");
      return;
    }

    const finalAmount = Number(amount);

    const sameOpenAmount = allBattles.some((battle) => {
      const status = String(battle?.status || "").toLowerCase();
      return status === "open" && Number(battle?.amount) === finalAmount;
    });

    if (sameOpenAmount) {
      alert(`₹${finalAmount} ki open battle already lagi hui hai.`);
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/battle/create`,
        { amount: finalAmount },
        authHeader()
      );

      setAmount("");
      await fetchBattles();
      alert("Battle set ho gayi!");
    } catch (err) {
      alert(err.response?.data?.msg || "Battle create failed");
    } finally {
      setLoading(false);
    }
  };

  const playBattle = async (battleId) => {
    if (myActiveBattle) {
      alert("Aapki ek battle already chal rahi hai. Pehle uska result update karo.");
      return;
    }

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
      alert(err.response?.data?.msg || "Play request failed");
    } finally {
      setLoading(false);
    }
  };

  const startBattle = async (battleId) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/battle/start/${battleId}`,
        {},
        authHeader()
      );

      const startedId = res.data?.battle?.battleId || battleId;

      await fetchBattles();
      navigate(`/room-code/${startedId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Start battle failed");
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
    if (!window.confirm("Battle cancel karni hai?")) return;

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE}/battle/cancel/${battleId}`,
        {},
        authHeader()
      );

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
    const isCreator = getCreatorId(battle) === myId;
    const isOpponent = getOpponentId(battle) === myId;

    if (status === "open" && isCreator) {
      return (
        <button
          disabled={loading}
          onClick={() => cancelBattle(battle.battleId)}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
        >
          Cancel
        </button>
      );
    }

    if (status === "open" && !isCreator) {
      return (
        <button
          disabled={loading}
          onClick={() => playBattle(battle.battleId)}
          className="rounded-xl bg-green-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
        >
          Play
        </button>
      );
    }

    if (status === "join_requested" && isCreator) {
      return (
        <div className="flex flex-col gap-2">
          <button
            disabled={loading}
            onClick={() => startBattle(battle.battleId)}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            Start
          </button>

          <button
            disabled={loading}
            onClick={() => rejectBattle(battle.battleId)}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isOpponent) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-300 border-t-green-600" />
          <p className="text-xs font-black text-slate-600">Waiting Start</p>
        </div>
      );
    }

    return (
      <button
        disabled
        className="rounded-xl bg-slate-400 px-5 py-2 text-sm font-black text-white"
      >
        Busy
      </button>
    );
  };

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
              disabled={loading || mySearchingBattles.length >= MAX_SEARCHING_BATTLES}
              onClick={createBattle}
              className="w-full rounded-xl bg-gradient-to-b from-red-500 to-red-700 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Set Amount"}
            </button>

            <p className="text-center text-xs font-black text-slate-500">
              Searching battle: {mySearchingBattles.length}/{MAX_SEARCHING_BATTLES}
            </p>
          </div>
        </div>

        <SectionTitle title="🔥 Open Battles" />

        {visibleOpenBattles.length === 0 ? (
          <EmptyBox text="Abhi koi open battle nahi hai" />
        ) : (
          visibleOpenBattles.map((battle) => (
            <BattleCard
              key={battle.battleId}
              battle={battle}
              action={getOpenAction(battle)}
            />
          ))
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
                  className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-black text-white"
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
        {battle.createdBy?.name || "Player"} vs{" "}
        {battle.opponent?.name || "Waiting..."}
      </div>

      <div className="grid grid-cols-3 items-center gap-2 px-4 py-3">
        <div>
          <p className={`text-xs font-black ${dark ? "text-white/70" : "text-slate-500"}`}>
            Entry Fee
          </p>
          <p className="mt-1 text-2xl font-black">₹{battle.amount}</p>
        </div>

        <div className="text-center">{action}</div>

        <div className="text-right">
          <p className={`text-xs font-black ${dark ? "text-white/70" : "text-slate-500"}`}>
            Winning
          </p>
          <p className={`mt-1 text-2xl font-black ${dark ? "" : "text-emerald-700"}`}>
            ₹{winPrize}
          </p>
        </div>
      </div>
    </div>
  );
}