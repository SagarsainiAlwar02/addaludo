import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://api.addaludo.com/api");

const FILE_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://api.addaludo.com";

export default function RoomCode() {
  const { battleId } = useParams();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchBattle = async () => {
    try {
      const res = await axios.get(`${API_BASE}/battle/${battleId}`, authHeader());
      setBattle(res.data.battle);
      setRoomCode(res.data.battle?.ludoKingRoomCode || "");
    } catch (err) {
      alert(err.response?.data?.msg || "Battle load failed");
      navigate("/battle");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBattle();
    const interval = setInterval(fetchBattle, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [battleId]);

  const saveRoomCode = async () => {
    if (!roomCode.trim()) {
      alert("Room code डालो");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/battle/room-code/${battleId}`,
        { roomCode: roomCode.trim() },
        authHeader()
      );

      await fetchBattle();
      alert("Room code saved");
    } catch (err) {
      alert(err.response?.data?.msg || "Room code save failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!battle?.ludoKingRoomCode) return;

    await navigator.clipboard.writeText(battle.ludoKingRoomCode);
    alert("Room code copied");
  };

  const uploadResult = async () => {
    if (!screenshot) {
      alert("Winner screenshot select करो");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("screenshot", screenshot);

      await axios.post(`${API_BASE}/battle/result/${battleId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchBattle();
      alert("Result uploaded. Admin approval pending.");
    } catch (err) {
      alert(err.response?.data?.msg || "Result upload failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelBattle = async () => {
    if (!window.confirm("Battle cancel करनी है?")) return;

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE}/battle/cancel/${battleId}`,
        {},
        authHeader()
      );

      alert("Battle cancelled");
      navigate("/battle");
    } catch (err) {
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] pt-20 pb-28 font-black text-slate-800">
        Loading Battle...
      </div>
    );
  }

  if (!battle) return null;

  const isWaiting = battle.status === "open";
  const canRoomCode = ["running", "room_submitted"].includes(battle.status);
  const canUpload = ["running", "room_submitted"].includes(battle.status);

  return (
    <div className="min-h-screen bg-[#f4f6f8] pt-20 pb-28 px-3 text-black">
      <div className="mx-auto max-w-[520px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-lg font-black text-white">
            🎮 Ludo King Room
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-2xl bg-[#342b72] p-4 text-white">
              <p className="text-xs font-bold opacity-80">Battle ID</p>
              <p className="break-all text-sm font-black">{battle.battleId}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold opacity-80">Entry Fee</p>
                  <p className="text-2xl font-black">₹{battle.amount}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold opacity-80">Winning Prize</p>
                  <p className="text-2xl font-black">₹{battle.prize}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <p>
                  Player 1: <b>{battle.createdBy?.name || "Player"}</b>
                </p>
                <p>
                  Player 2: <b>{battle.opponent?.name || "Waiting..."}</b>
                </p>
                <p>
                  Status: <b>{battle.status}</b>
                </p>
              </div>
            </div>

            {isWaiting && (
              <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-center text-sm font-black text-yellow-800">
                Opponent ka wait ho raha hai. Dusra player Play dabayega tab room code active hoga.
              </div>
            )}

            {canRoomCode && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-black text-slate-900">Room Code</h2>

                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Ludo King Room Code"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-black outline-none focus:border-cyan-500"
                />

                <button
                  disabled={loading}
                  onClick={saveRoomCode}
                  className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Room Code"}
                </button>

                {battle.ludoKingRoomCode && (
                  <button
                    onClick={copyCode}
                    className="w-full rounded-xl bg-green-600 py-3 font-black text-white"
                  >
                    Copy Room Code: {battle.ludoKingRoomCode}
                  </button>
                )}
              </div>
            )}

            {canUpload && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-black text-slate-900">Result Proof</h2>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />

                <button
                  disabled={loading}
                  onClick={uploadResult}
                  className="w-full rounded-xl bg-orange-500 py-3 font-black text-white disabled:opacity-60"
                >
                  Upload Winner Screenshot
                </button>
              </div>
            )}

            {battle.status === "result_submitted" && (
              <div className="rounded-xl bg-yellow-400 p-3 text-center font-black text-black">
                Result submitted. Admin approval pending.
              </div>
            )}

            {battle.status === "approved" && (
              <div className="rounded-xl bg-green-600 p-3 text-center font-black text-white">
                Winner Approved ✅ Prize Added
              </div>
            )}

            {battle.status === "rejected" && (
              <div className="rounded-xl bg-red-600 p-3 text-center font-black text-white">
                Battle Rejected / Refunded
              </div>
            )}

            {battle.screenshot && (
              <img
                src={`${FILE_BASE}${battle.screenshot}`}
                alt="result"
                className="mx-auto max-h-72 rounded-xl border"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/battle")}
                className="flex-1 rounded-xl bg-slate-800 py-3 font-black text-white"
              >
                Back
              </button>

              {battle.status === "open" && (
                <button
                  disabled={loading}
                  onClick={cancelBattle}
                  className="flex-1 rounded-xl bg-red-600 py-3 font-black text-white disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
              Note: Room code website generate nahi karti. Ludo King app me room create karke code yaha paste karna hoga.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}