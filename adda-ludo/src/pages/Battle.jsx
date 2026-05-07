import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const defaultBattles = [
  50, 100, 150, 200, 250, 500, 750, 1000, 1500, 2000,
  2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000
];

const fakeRunningBattles = [
  { _id: "fake-1", amount: 100, createdBy: { name: "Rohit" }, opponent: { name: "Aman" } },
  { _id: "fake-2", amount: 250, createdBy: { name: "Sagar" }, opponent: { name: "Vikas" } },
  { _id: "fake-3", amount: 500, createdBy: { name: "Rahul" }, opponent: { name: "Neeraj" } },
  { _id: "fake-4", amount: 1000, createdBy: { name: "Karan" }, opponent: { name: "Deepak" } },
];

function calculatePrize(amount) {
  amount = Number(amount);
  const totalPool = amount * 2;

  const commissionPercentPerUser = amount <= 500 ? 5 : 2.5;
  const totalCommissionPercent = commissionPercentPerUser * 2;
  const commission = Math.floor((totalPool * totalCommissionPercent) / 100);

  return totalPool - commission;
}

export default function Battle() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const checkLogin = () => {
    if (!getToken()) {
      alert("Login required");
      navigate("/login");
      return false;
    }
    return true;
  };

  const validateAmount = (finalAmount) => {
    if (!finalAmount || finalAmount < 50) {
      alert("Minimum battle ₹50 hai");
      return false;
    }

    if (finalAmount > 100000) {
      alert("Maximum battle ₹100000 hai");
      return false;
    }

    if (finalAmount % 50 !== 0) {
      alert("Battle amount ₹50 ke multiple me hona chahiye");
      return false;
    }

    return true;
  };

  const createBattle = async (entryAmount) => {
    if (!checkLogin()) return;

    const finalAmount = Number(entryAmount || amount);

    if (!validateAmount(finalAmount)) return;

    try {
      setLoading(true);
      setSearching(true);

      const res = await axios.post(
        `${API_BASE}/battle/create`,
        { amount: finalAmount },
        authHeader()
      );

      setAmount("");

      const battleId = res.data?.battle?.battleId;

      if (battleId) {
        setTimeout(() => {
          navigate(`/room-code/${battleId}`);
        }, 1000);
      } else {
        setSearching(false);
        alert("Battle create hui but battleId nahi mila");
      }
    } catch (err) {
      setSearching(false);
      alert(err.response?.data?.msg || "Battle create failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelSearching = () => {
    setSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black pt-20 pb-28 px-3">
      <div className="max-w-[760px] mx-auto">
        {searching && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"></div>

              <h2 className="text-2xl font-black text-gray-900">
                Searching Battle...
              </h2>

              <p className="mt-2 text-sm font-semibold text-gray-500">
                Opponent ya room ready ho raha hai. Please wait.
              </p>

              <button
                onClick={cancelSearching}
                className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-black text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-300 rounded-md mb-5 overflow-hidden">
          <div className="bg-gradient-to-b from-gray-200 to-gray-500 text-white font-bold px-4 py-2 text-xl">
            ⚔️ Set Battle
          </div>

          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[50, 100, 200, 500].map((amt) => (
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
                min="50"
                max="100000"
                step="50"
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

            <p className="mt-2 text-xs font-bold text-gray-500">
              Minimum ₹50. Maximum ₹100000. Amount ₹50 ke multiple me hona chahiye.
            </p>
          </div>
        </div>

        <div className="border border-black rounded-md mb-4 overflow-hidden">
          <div className="bg-gradient-to-b from-gray-200 via-gray-500 to-black text-white font-bold px-4 py-2 text-xl">
            🎯 Select Battle Amount
          </div>
        </div>

        {defaultBattles.map((amt) => {
          const winPrize = calculatePrize(amt);

          return (
            <div
              key={amt}
              className="bg-[#b7e7ea] border border-gray-400 rounded-md mb-5 overflow-hidden"
            >
              <div className="border-b border-gray-400 px-3 py-2 text-xl font-semibold">
                Battle Amount
              </div>

              <div className="grid grid-cols-3 items-center px-4 py-5">
                <div>
                  <p className="font-bold text-lg">Entry Fee</p>
                  <p className="text-3xl font-semibold">💸{amt}</p>
                </div>

                <div className="text-center">
                  <button
                    disabled={loading}
                    onClick={() => createBattle(amt)}
                    className="bg-gradient-to-b from-slate-800 to-red-600 text-white px-8 py-2 rounded-md text-xl font-semibold disabled:opacity-60"
                  >
                    Set
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

        <div className="border border-black rounded-md mt-8 mb-4 overflow-hidden">
          <div className="bg-gradient-to-b from-gray-200 via-gray-500 to-black text-white font-bold px-4 py-2 text-xl">
            🏃‍♂️🏃‍♂️ Running Battles
          </div>
        </div>

        {fakeRunningBattles.map((battle) => {
          const winPrize = calculatePrize(battle.amount);

          return (
            <div
              key={battle._id}
              className="bg-[#4d3f91] text-white rounded-md mb-5 overflow-hidden border border-[#6b5bd6]"
            >
              <div className="border-b border-[#8678d9] px-3 py-2 text-xl font-bold">
                Game Play between {battle.createdBy?.name} & {battle.opponent?.name}
              </div>

              <div className="grid grid-cols-3 items-center px-4 py-5">
                <div>
                  <p className="font-bold text-lg">Entry Fee</p>
                  <p className="text-3xl font-bold">💸{battle.amount}</p>
                </div>

                <div className="text-center">
                  <button
                    disabled
                    className="bg-white text-blue-700 px-5 py-2 rounded-md font-black opacity-80 cursor-not-allowed"
                  >
                    Running
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">Winning Prize</p>
                  <p className="text-3xl font-bold">💸{winPrize}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}