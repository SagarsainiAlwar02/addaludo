import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const defaultBattles = [
  100, 150, 200, 250, 500, 750, 1000, 1500, 2000,
  2300, 2500, 3000, 3500, 4000, 6000, 8000, 10000
];

const fakeRunningBattles = [
  {
    _id: "fake-running-1",
    amount: 100,
    prize: 180,
    battleId: "fake_room_101",
    createdBy: { name: "Rohit" },
    opponent: { name: "Aman" }
  },
  {
    _id: "fake-running-2",
    amount: 250,
    prize: 450,
    battleId: "fake_room_102",
    createdBy: { name: "Sagar" },
    opponent: { name: "Vikas" }
  },
  {
    _id: "fake-running-3",
    amount: 500,
    prize: 900,
    battleId: "fake_room_103",
    createdBy: { name: "Rahul" },
    opponent: { name: "Neeraj" }
  },
  {
    _id: "fake-running-4",
    amount: 1000,
    prize: 1800,
    battleId: "fake_room_104",
    createdBy: { name: "Karan" },
    opponent: { name: "Deepak" }
  },
  {
    _id: "fake-running-5",
    amount: 2000,
    prize: 3600,
    battleId: "fake_room_105",
    createdBy: { name: "Ankit" },
    opponent: { name: "Mohit" }
  }
];

export default function Battle() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [openBattles, setOpenBattles] = useState([]);
  const [myBattles, setMyBattles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const checkLogin = () => {
    if (!getToken()) {
      alert("Login required");
      navigate("/login");
      return false;
    }
    return true;
  };

  const fetchBattles = async () => {
    if (!getToken()) return;

    try {
      const [openRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/battle/open`, authHeader()),
        axios.get(`${API_BASE}/battle/my`, authHeader())
      ]);

      setOpenBattles(openRes.data.battles || []);
      setMyBattles(myRes.data.battles || []);
    } catch (err) {
      console.log("Battle fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchBattles();
    const interval = setInterval(fetchBattles, 5000);
    return () => clearInterval(interval);
  }, []);

  const createBattle = async (entryAmount) => {
    if (!checkLogin()) return;

    const finalAmount = Number(entryAmount || amount);

    if (!finalAmount || finalAmount < 10) {
      alert("Minimum ₹10 required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/battle/create`,
        { amount: finalAmount },
        authHeader()
      );

      setAmount("");

      const battleId = res.data?.battle?.battleId;

      if (battleId) {
        navigate(`/room-code/${battleId}`);
      } else {
        await fetchBattles();
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Battle create failed");
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async (battleId) => {
    if (!checkLogin()) return;

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/battle/join/${battleId}`,
        {},
        authHeader()
      );

      const joinedBattleId = res.data?.battle?.battleId || battleId;
      navigate(`/room-code/${joinedBattleId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Join failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelBattle = async (battleId) => {
    if (!window.confirm("Battle cancel karke refund karna hai?")) return;

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE}/battle/cancel/${battleId}`,
        {},
        authHeader()
      );

      await fetchBattles();
    } catch (err) {
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  const myOpenBattles = myBattles.filter((b) => b.status === "open");

  const runningBattles = myBattles.filter((b) =>
    ["running", "room_submitted", "result_submitted", "approved", "rejected"].includes(b.status)
  );

  const battlesToShow =
    runningBattles.length > 0 ? runningBattles : fakeRunningBattles;

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black pt-20 pb-28 px-3">
      <div className="max-w-[760px] mx-auto">

        <div className="bg-white border border-gray-300 rounded-md mb-5 overflow-hidden">
          <div className="bg-gradient-to-b from-gray-200 to-gray-500 text-white font-bold px-4 py-2 text-xl">
            ⚔️ Create Battle
          </div>

          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  disabled={loading}
                  onClick={() => createBattle(amt)}
                  className="bg-gradient-to-b from-green-400 to-green-700 text-white rounded-md py-2 font-bold text-lg disabled:opacity-60"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 border border-gray-400 rounded-md px-3 py-2 text-lg outline-none"
              />

              <button
                disabled={loading}
                onClick={() => createBattle()}
                className="px-7 bg-gradient-to-b from-red-400 to-red-700 text-white rounded-md font-bold text-lg disabled:opacity-60"
              >
                {loading ? "Wait" : "SET"}
              </button>
            </div>
          </div>
        </div>

        <div className="border border-black rounded-md mb-4 overflow-hidden">
          <div className="bg-gradient-to-b from-gray-200 via-gray-500 to-black text-white font-bold px-4 py-2 text-xl">
            🏃‍♂️🏃‍♂️ Open Battles
          </div>
        </div>

        {defaultBattles.map((amt) => {
          const existing = openBattles.find((b) => Number(b.amount) === Number(amt));
          const winPrize = existing?.prize || Math.floor(amt * 2 * 0.9);

          return (
            <div
              key={amt}
              className="bg-[#b7e7ea] border border-gray-400 rounded-md mb-5 overflow-hidden"
            >
              <div className="border-b border-gray-400 px-3 py-2 text-xl font-semibold">
                {existing
                  ? `Challenge From ${existing.createdBy?.name || "Player"}`
                  : "Challenge Available"}
              </div>

              <div className="grid grid-cols-3 items-center px-4 py-5">
                <div>
                  <p className="font-bold text-lg">Entry Fee</p>
                  <p className="text-3xl font-semibold">💸{amt}</p>
                </div>

                <div className="text-center">
                  <button
                    disabled={loading}
                    onClick={() =>
                      existing ? joinBattle(existing.battleId) : createBattle(amt)
                    }
                    className="bg-gradient-to-b from-slate-800 to-red-600 text-white px-8 py-2 rounded-md text-xl font-semibold disabled:opacity-60"
                  >
                    {existing ? "Play" : "Set"}
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">Winning Prize</p>
                  <p className="text-3xl font-semibold">💸{winPrize}</p>
                </div>
              </div>
            </div>
          );
        })}

        {myOpenBattles.length > 0 && (
          <>
            <div className="border border-black rounded-md mt-8 mb-4 overflow-hidden">
              <div className="bg-gradient-to-b from-gray-200 via-gray-500 to-black text-white font-bold px-4 py-2 text-xl">
                ⏳ My Waiting Battles
              </div>
            </div>

            {myOpenBattles.map((battle) => (
              <div
                key={battle._id}
                className="bg-[#b7e7ea] border border-gray-400 rounded-md mb-5 overflow-hidden"
              >
                <div className="border-b border-gray-400 px-3 py-2 text-xl font-semibold">
                  Challenge From You
                </div>

                <div className="grid grid-cols-3 items-center px-4 py-5">
                  <div>
                    <p className="font-bold text-lg">Entry Fee</p>
                    <p className="text-3xl font-semibold">💸{battle.amount}</p>
                  </div>

                  <div className="text-center space-y-2">
                    <button
                      onClick={() => navigate(`/room-code/${battle.battleId}`)}
                      className="bg-green-600 text-white px-5 py-2 rounded-md text-lg font-semibold"
                    >
                      Open
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => cancelBattle(battle.battleId)}
                      className="block mx-auto bg-red-600 text-white px-5 py-2 rounded-md text-lg font-semibold disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">Winning Prize</p>
                    <p className="text-3xl font-semibold">💸{battle.prize}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="border border-black rounded-md mt-8 mb-4 overflow-hidden">
          <div className="bg-gradient-to-b from-gray-200 via-gray-500 to-black text-white font-bold px-4 py-2 text-xl">
            🏃‍♂️🏃‍♂️ Running Battles
          </div>
        </div>

        {battlesToShow.map((battle) => (
          <div
            key={battle._id}
            className="bg-[#4d3f91] text-white rounded-md mb-5 overflow-hidden border border-[#6b5bd6]"
          >
            <div className="border-b border-[#8678d9] px-3 py-2 text-xl font-bold">
              Game Play between {battle.createdBy?.name || "Player"} &{" "}
              {battle.opponent?.name || "Opponent"}
            </div>

            <div className="grid grid-cols-3 items-center px-4 py-5">
              <div>
                <p className="font-bold text-lg">Entry Fee</p>
                <p className="text-3xl font-bold">💸{battle.amount}</p>
              </div>

              <div className="text-center">
                <button
                  disabled={String(battle._id).startsWith("fake-running")}
                  onClick={() => navigate(`/room-code/${battle.battleId}`)}
                  className="bg-white text-blue-700 px-5 py-2 rounded-md font-black disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  Running
                </button>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">Winning Prize</p>
                <p className="text-3xl font-bold">💸{battle.prize}</p>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}