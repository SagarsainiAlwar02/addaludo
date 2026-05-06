import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";
const FILE_BASE = "http://localhost:5000";

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
    headers: { Authorization: `Bearer ${token}` }
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
          "Content-Type": "multipart/form-data"
        }
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
      <div className="min-h-screen flex items-center justify-center font-bold">
        Loading Battle...
      </div>
    );
  }

  if (!battle) return null;

  const isWaiting = battle.status === "open";
  const canRoomCode = ["running", "room_submitted"].includes(battle.status);
  const canUpload = ["running", "room_submitted"].includes(battle.status);

  return (
    <div className="min-h-screen bg-[#f4f4f4] pt-20 pb-28 px-3 text-black">
      <div className="max-w-[520px] mx-auto">
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="bg-gradient-to-b from-gray-300 via-gray-600 to-black text-white px-4 py-3 font-black text-xl">
            🎮 Ludo King Room
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-[#4d3f91] text-white rounded-lg p-4">
              <p className="text-sm opacity-90">Battle ID</p>
              <p className="font-bold break-all">{battle.battleId}</p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-sm opacity-90">Entry Fee</p>
                  <p className="text-2xl font-black">₹{battle.amount}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm opacity-90">Winning Prize</p>
                  <p className="text-2xl font-black">₹{battle.prize}</p>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <p>Player 1: <b>{battle.createdBy?.name || "Player"}</b></p>
                <p>Player 2: <b>{battle.opponent?.name || "Waiting..."}</b></p>
                <p>Status: <b>{battle.status}</b></p>
              </div>
            </div>

            {isWaiting && (
              <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 text-center font-bold">
                Opponent ka wait ho raha hai. Dusra player Play dabayega tab room code active hoga.
              </div>
            )}

            {canRoomCode && (
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h2 className="text-xl font-black">Room Code</h2>

                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Ludo King Room Code"
                  className="w-full border rounded-lg px-4 py-3 text-xl font-bold outline-none"
                />

                <button
                  disabled={loading}
                  onClick={saveRoomCode}
                  className="w-full bg-yellow-400 text-black rounded-lg py-3 font-black disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Room Code"}
                </button>

                {battle.ludoKingRoomCode && (
                  <button
                    onClick={copyCode}
                    className="w-full bg-green-600 text-white rounded-lg py-3 font-black"
                  >
                    Copy Room Code: {battle.ludoKingRoomCode}
                  </button>
                )}
              </div>
            )}

            {canUpload && (
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h2 className="text-xl font-black">Result Proof</h2>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="w-full"
                />

                <button
                  disabled={loading}
                  onClick={uploadResult}
                  className="w-full bg-orange-500 text-white rounded-lg py-3 font-black disabled:opacity-60"
                >
                  Upload Winner Screenshot
                </button>
              </div>
            )}

            {battle.status === "result_submitted" && (
              <div className="bg-yellow-400 text-black rounded-lg p-3 text-center font-black">
                Result submitted. Admin approval pending.
              </div>
            )}

            {battle.status === "approved" && (
              <div className="bg-green-600 text-white rounded-lg p-3 text-center font-black">
                Winner Approved ✅ Prize Added
              </div>
            )}

            {battle.status === "rejected" && (
              <div className="bg-red-600 text-white rounded-lg p-3 text-center font-black">
                Battle Rejected / Refunded
              </div>
            )}

            {battle.screenshot && (
              <img
                src={`${FILE_BASE}${battle.screenshot}`}
                alt="result"
                className="rounded-lg border max-h-72 mx-auto"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/battle")}
                className="flex-1 bg-slate-800 text-white rounded-lg py-3 font-black"
              >
                Back
              </button>

              {battle.status === "open" && (
                <button
                  disabled={loading}
                  onClick={cancelBattle}
                  className="flex-1 bg-red-600 text-white rounded-lg py-3 font-black disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="text-xs text-gray-600 leading-5">
              Note: Room code website generate nahi karti. Ludo King app me room create karke code yaha paste karna hoga.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}