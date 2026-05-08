import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

function generateBattleAmounts() {
  const list = [];

  for (let amt = 50; amt <= 500; amt += 50) {
    list.push(amt);
  }

  for (let amt = 650; amt <= 10000; amt += 150) {
    list.push(amt);
  }

  return list;
}

const allBattleAmounts = generateBattleAmounts();

const fakeRunningBattles = [
  { _id: "fake-1", amount: 100, createdBy: { name: "Rohit" }, opponent: { name: "Aman" } },
  { _id: "fake-2", amount: 250, createdBy: { name: "Sagar" }, opponent: { name: "Vikas" } },
  { _id: "fake-3", amount: 500, createdBy: { name: "Rahul" }, opponent: { name: "Neeraj" } },
  { _id: "fake-4", amount: 1000, createdBy: { name: "Karan" }, opponent: { name: "Deepak" } },
];

function calculatePrize(amount) {
  const totalPool = Number(amount) * 2;
  const commissionPercentPerUser = Number(amount) <= 500 ? 5 : 2.5;
  const commission = Math.floor((totalPool * commissionPercentPerUser * 2) / 100);
  return totalPool - commission;
}

export default function Battle() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [searchedAmount, setSearchedAmount] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
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

    if (finalAmount > 10000) {
      alert("Maximum battle ₹10000 hai");
      return false;
    }

    if (finalAmount <= 500 && finalAmount % 50 !== 0) {
      alert("₹50 se ₹500 tak amount ₹50 ke multiple me hona chahiye");
      return false;
    }

    if (finalAmount > 500 && (finalAmount - 500) % 150 !== 0) {
      alert("₹500 ke baad amount ₹150 ke gap/multiple me hona chahiye");
      return false;
    }

    return true;
  };

  const filteredBattles = useMemo(() => {
    if (!hasSearched) return [];

    const value = Number(searchedAmount);
    return allBattleAmounts.filter((amt) => amt === value);
  }, [searchedAmount, hasSearched]);

  const handleSearch = () => {
    const finalAmount = Number(amount);

    if (!validateAmount(finalAmount)) return;

    setSearchedAmount(String(finalAmount));
    setHasSearched(true);
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
        }, 700);
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

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-black pt-20 pb-28 px-3">
      <div className="mx-auto max-w-[650px]">
        {searching && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"></div>
              <h2 className="text-xl font-black text-gray-900">Searching Battle...</h2>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                Room ready ho raha hai. Please wait.
              </p>
              <button
                onClick={() => setSearching(false)}
                className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-black text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 rounded-xl bg-[#1f2937] px-4 py-4 text-center text-[15px] font-bold leading-7 text-white shadow-md">
          गोटी open होने के बाद अगर कोई भी user left होता है तो lose माना जायेगा
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
            ⚔️ Search Battle Amount
          </div>

          <div className="p-4">
            <div className="flex gap-2">
              <input
                type="number"
                min="50"
                max="10000"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setHasSearched(false);
                  setSearchedAmount("");
                }}
                className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-3 text-base font-bold outline-none focus:border-cyan-500"
              />

              <button
                disabled={loading}
                onClick={handleSearch}
                className="rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-5 py-3 text-base font-black text-white shadow-sm disabled:opacity-60"
              >
                Search
              </button>
            </div>

            <p className="mt-3 text-xs font-bold text-slate-500">
              ₹50 से ₹500 तक ₹50 के gap में, उसके बाद ₹10000 तक ₹150 के gap में amount डालें।
            </p>

            {hasSearched && (
              <button
                onClick={() => {
                  setHasSearched(false);
                  setSearchedAmount("");
                  setAmount("");
                }}
                className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {hasSearched && (
          <>
            <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
                🎯 Select Battle Amount
              </div>
            </div>

            {filteredBattles.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-center font-black text-red-600 shadow-sm">
                Is amount ki battle available nahi hai.
              </div>
            ) : (
              filteredBattles.map((amt) => {
                const winPrize = calculatePrize(amt);

                return (
                  <div
                    key={amt}
                    className="mb-3 overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm"
                  >
                    <div className="bg-cyan-50 px-4 py-2 text-sm font-black text-slate-700">
                      Battle Amount
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2 px-4 py-3">
                      <div>
                        <p className="text-xs font-black text-slate-500">Entry Fee</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">₹{amt}</p>
                      </div>

                      <div className="text-center">
                        <button
                          disabled={loading}
                          onClick={() => createBattle(amt)}
                          className="rounded-xl bg-gradient-to-b from-slate-800 to-red-600 px-6 py-2 text-base font-black text-white shadow disabled:opacity-60"
                        >
                          Set
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-slate-500">Winning</p>
                        <p className="mt-1 text-2xl font-black text-emerald-700">
                          ₹{winPrize}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        <div className="mt-6 mb-3 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
            🏃 Running Battles
          </div>
        </div>

        {fakeRunningBattles.map((battle) => {
          const winPrize = calculatePrize(battle.amount);

          return (
            <div
              key={battle._id}
              className="mb-3 overflow-hidden rounded-2xl border border-violet-200 bg-[#342b72] text-white shadow-sm"
            >
              <div className="border-b border-white/15 px-4 py-2 text-sm font-black">
                {battle.createdBy?.name} vs {battle.opponent?.name}
              </div>

              <div className="grid grid-cols-3 items-center gap-2 px-4 py-3">
                <div>
                  <p className="text-xs font-black text-white/70">Entry Fee</p>
                  <p className="mt-1 text-2xl font-black">₹{battle.amount}</p>
                </div>

                <div className="text-center">
                  <button
                    disabled
                    className="rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 opacity-90"
                  >
                    Running
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-white/70">Winning</p>
                  <p className="mt-1 text-2xl font-black">₹{winPrize}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}