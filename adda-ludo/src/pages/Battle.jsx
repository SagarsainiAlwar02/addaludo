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
  };

  const myId = getUserId();

  const authHeader = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const getCreatorId = (battle) =>
    String(
      battle?.createdBy?._id ||
        battle?.createdBy?.id ||
        battle?.createdBy ||
        ""
    );

  const getOpponentId = (battle) =>
    String(
      battle?.opponent?._id ||
        battle?.opponent?.id ||
        battle?.opponent ||
        ""
    );

  const hasMyResult = (battle) => {
    return Array.isArray(battle?.results)
      ? battle.results.some(
          (item) => String(item?.user?._id || item?.user || "") === myId
        )
      : false;
  };

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

        return (
          status === "open" ||
          (status === "join_requested" && (isCreator || isOpponent))
        );
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

      const res = await axios.post(
        `${API_BASE}/battle/join/${battleId}`,
        {},
        authHeader()
      );

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

      const res = await axios.post(
        `${API_BASE}/battle/start/${battleId}`,
        {},
        authHeader()
      );

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
    const isMine = getCreatorId(battle) === myId;
    const isOpponent = getOpponentId(battle) === myId;

    if (status === "open" && isMine) {
      return (
        <button
          disabled={loading}
          onClick={() => cancelBattle(battle.battleId)}
          className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-black text-xs uppercase disabled:opacity-50"
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
          className="bg-green-500 text-white px-6 py-2 rounded-xl font-black text-xs shadow-md disabled:opacity-50"
        >
          PLAY
        </button>
      );
    }

    if (status === "join_requested" && isMine) {
      return (
        <div className="flex flex-col gap-2">
          <button
            disabled={loading}
            onClick={() => startBattle(battle.battleId)}
            className="bg-green-500 text-white px-5 py-2 rounded-xl font-black text-xs shadow-md disabled:opacity-50"
          >
            START
          </button>

          <button
            disabled={loading}
            onClick={() => rejectBattle(battle.battleId)}
            className="bg-red-100 text-red-600 px-5 py-2 rounded-xl font-black text-xs disabled:opacity-50"
          >
            REJECT
          </button>
        </div>
      );
    }

    if (status === "join_requested" && isOpponent) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-green-500" />
          <p className="text-[10px] font-black text-gray-500">WAITING</p>
        </div>
      );
    }

    return (
      <button
        disabled
        className="bg-gray-300 text-gray-600 px-4 py-2 rounded-xl font-black text-xs"
      >
        BUSY
      </button>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen font-sans pb-24">
      <h2 className="text-2xl font-black text-center italic text-indigo-900 mb-6">
        ADDA LUDO
      </h2>

      <div className="bg-white p-6 rounded-3xl shadow-md mb-8">
        <input
          type="number"
          placeholder="Enter Amount"
          className="w-full p-4 bg-gray-50 rounded-2xl mb-3 outline-none font-bold"
          value={betAmount}
          min="50"
          max="100000"
          step="50"
          onChange={(e) => setBetAmount(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={handleCreate}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg disabled:opacity-50"
        >
          {loading ? "SETTING..." : "SET BATTLE"}
        </button>

        <p className="text-center text-[11px] font-bold text-gray-400 mt-3">
          Searching battle: {mySearchingBattles.length}/{MAX_SEARCHING_BATTLES}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-black px-2 text-gray-500 text-xs uppercase">
          Open Battles
        </h3>

        {visibleOpenBattles.length === 0 && (
          <p className="text-center text-gray-400 py-4 font-bold">
            No Battles Live
          </p>
        )}

        {visibleOpenBattles.map((b) => (
          <div
            key={b.battleId}
            className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm relative"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-50 p-2 rounded-xl text-center min-w-[60px]">
                <p className="font-black text-sm text-indigo-700">₹{b.amount}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  Winning
                </p>
                <p className="text-xs font-black text-green-600">
                  Win: ₹{b.prize || calculatePrize(b.amount)}
                </p>
                <p className="text-[10px] font-bold text-gray-400">
                  {b.createdBy?.name || "Player"} vs{" "}
                  {b.opponent?.name || "Waiting..."}
                </p>
              </div>
            </div>

            <div className="flex items-center">{getOpenAction(b)}</div>
          </div>
        ))}
      </div>

      {runningBattles.length > 0 && (
        <div className="mt-8">
          <h3 className="font-black mb-3 text-orange-500 text-xs uppercase px-2 tracking-widest">
            Running Matches
          </h3>

          {runningBattles.map((rb) => (
            <div
              key={rb.battleId}
              className="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 border-l-4 border-orange-500 shadow-sm"
            >
              <div>
                <p className="font-black text-sm text-slate-800">
                  ₹{rb.amount} Battle
                </p>
                <p className="text-[10px] text-orange-600 font-bold animate-pulse">
                  MATCH LIVE
                </p>
              </div>

              <button
                onClick={() => navigate(`/room-code/${rb.battleId}`)}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl font-black text-xs"
              >
                VIEW
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingBattles.length > 0 && (
        <div className="mt-8">
          <h3 className="font-black mb-3 text-yellow-500 text-xs uppercase px-2 tracking-widest">
            Pending Results
          </h3>

          {pendingBattles.map((rb) => (
            <div
              key={rb.battleId}
              className="bg-white p-4 rounded-2xl flex justify-between items-center mb-3 border-l-4 border-yellow-500 shadow-sm"
            >
              <div>
                <p className="font-black text-sm text-slate-800">
                  ₹{rb.amount} Battle
                </p>
                <p className="text-[10px] text-yellow-600 font-bold animate-pulse">
                  RESULT PENDING
                </p>
              </div>

              <button
                onClick={() => navigate(`/room-code/${rb.battleId}`)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-black text-xs"
              >
                VIEW
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Battle;