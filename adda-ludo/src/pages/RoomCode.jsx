import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getData, getError } from "../api.js";
import socket from "../socket.js";
import compressImage from "../utils/compressImage.js";

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user?._id || user?.id) return String(user._id || user.id);

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

export default function RoomCode() {
  const { battleId } = useParams();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [selectedResult, setSelectedResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const myId = getUserId();

  const mapContest = (c) => ({
    ...c,
    battleId: c.contestId,
    amount: c.entryFee,
  });

  const fetchBattle = async () => {
    try {
      const res = await api.get(`/contests/${battleId}`);
      const data = getData(res);
      const contest = data?.contest;
      setBattle(contest ? mapContest(contest) : null);

      const serverRoomCode = contest?.ludoKingRoomCode || "";
      setRoomCode((prev) => {
        if (serverRoomCode) return serverRoomCode;
        return prev;
      });
    } catch (err) {
      alert(getError(err));
      navigate("/battle");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    fetchBattle();

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-contest", battleId);

    const handleContestUpdate = () => {
      fetchBattle();
    };

    socket.on("contest-updated", handleContestUpdate);

    const timerInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      socket.off("contest-updated", handleContestUpdate);
      clearInterval(timerInterval);
    };
    // eslint-disable-next-line
  }, [battleId]);

  const isCreator = useMemo(() => {
    const creatorId = String(battle?.createdBy?._id || battle?.createdBy || "");
    return creatorId === myId;
  }, [battle, myId]);

  const myResultSubmitted = useMemo(() => {
    return (battle?.results || []).some((item) => {
      const itemUser = String(item?.user?._id || item?.user || "");
      return itemUser === myId && item.result;
    });
  }, [battle, myId]);

  const timerLeft = useMemo(() => {
    if (!battle?.timerStartedAt) return 120;

    const start = new Date(battle.timerStartedAt).getTime();
    const diff = Math.floor((now - start) / 1000);
    return Math.max(0, 120 - diff);
  }, [battle, now]);

  const saveRoomCode = async () => {
    const code = roomCode.trim();

    if (!/^\d{8}$/.test(code)) {
      alert("Room code only 8 digit");
      return;
    }

    try {
      setLoading(true);

      await api.post(`/contests/room-code/${battleId}`, { roomCode: code });

      await fetchBattle();
      alert("Room code saved");
    } catch (err) {
      alert(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!battle?.ludoKingRoomCode) return;
    await navigator.clipboard.writeText(battle.ludoKingRoomCode);
    alert("Room code copied");
  };

  const submitResult = async () => {
    if (!selectedResult) {
      alert("Win, Loss ya Cancel select karo");
      return;
    }

    if (selectedResult === "win" && !screenshot) {
      alert("Winning screenshot upload karo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("result", selectedResult);

      if (selectedResult === "win" && screenshot) {
        const compressedScreenshot = await compressImage(screenshot);
        formData.append("screenshot", compressedScreenshot);
      }

      const res = await api.post(`/contests/result/${battleId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchBattle();

      const msg = res.data?.message || "Result submitted.";
      alert(msg);

      setSelectedResult("");
      setScreenshot(null);
    } catch (err) {
      alert(getError(err));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] pt-20 pb-40 font-black text-slate-800">
        Loading Battle...
      </div>
    );
  }

  if (!battle) return null;

  const canResult =
    ["running", "room_submitted", "cancel_requested", "result_submitted"].includes(
      String(battle.status || "").toLowerCase()
    ) && !myResultSubmitted;

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-3 pt-20 pb-40 text-black">
      <div className="mx-auto max-w-[540px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-600 px-4 py-3 text-white">
            <button
              onClick={() => navigate("/battle")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <ArrowLeft size={22} />
            </button>

            <h2 className="text-lg font-black">🎮 Battle Room</h2>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-2xl bg-[#342b72] p-4 text-white">
              <div className="text-center">
                <p className="text-xs font-bold opacity-80">Match</p>
                <h2 className="mt-1 text-xl font-black">
                  {battle.createdBy?.name || "User 1"} VS{" "}
                  {battle.opponent?.name || "Waiting..."}
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs font-bold opacity-80">Entry</p>
                  <p className="text-xl font-black">₹{battle.amount}</p>
                </div>

                <div>
                  <p className="text-xs font-bold opacity-80">Timer</p>
                  <p className="text-xl font-black text-yellow-300">
                    {timerLeft}s
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold opacity-80">Winning</p>
                  <p className="text-xl font-black">₹{battle.prize}</p>
                </div>
              </div>
            </div>

            {!battle.opponent && (
              <InfoBox text="Opponent ka wait ho raha hai. Jab koi player join karega tab creator start karega." />
            )}

            {battle.opponent && !battle.ludoKingRoomCode && !isCreator && (
              <InfoBox text="Waiting for room code. Battle creator room code set karega." />
            )}

            {battle.opponent && !battle.ludoKingRoomCode && isCreator && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-black text-slate-900">
                  Set Room Code
                </h2>

                <input
                  value={roomCode}
                  maxLength={8}
                  onChange={(e) =>
                    setRoomCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 8 digit room code"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-black outline-none focus:border-cyan-500"
                />

                <button
                  disabled={loading}
                  onClick={saveRoomCode}
                  className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Submit Room Code"}
                </button>
              </div>
            )}

            {battle.ludoKingRoomCode && (
              <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-sm font-black text-green-700">ROOM CODE</p>
                <p className="text-3xl font-black tracking-widest text-slate-900">
                  {battle.ludoKingRoomCode}
                </p>

                <button
                  onClick={copyCode}
                  className="w-full rounded-xl bg-green-600 py-3 font-black text-white"
                >
                  Copy Room Code
                </button>
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="mb-2 text-base font-black text-slate-900">
                Instructions
              </h3>

              <ul className="list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
                <li>Sabhi match ki recording kare.</li>
                <li>
                  Room code only classic mode ka set kare varna match cancel kare.
                  Dusra room code set karne par ₹25 ki penalty lag jayegi.
                </li>
                <li>
                  Result sahi update kare. Galat update karne par ₹50 ki penalty
                  lagegi.
                </li>
              </ul>
            </div>

            {canResult && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-black text-slate-900">
                  Update Result
                </h2>

                <div className="grid grid-cols-3 gap-2">
                  <ResultButton
                    active={selectedResult === "win"}
                    text="WIN"
                    color="green"
                    onClick={() => setSelectedResult("win")}
                  />

                  <ResultButton
                    active={selectedResult === "loss"}
                    text="LOSS"
                    color="red"
                    onClick={() => {
                      setSelectedResult("loss");
                      setScreenshot(null);
                    }}
                  />

                  <ResultButton
                    active={selectedResult === "cancel"}
                    text="CANCEL"
                    color="slate"
                    onClick={() => {
                      setSelectedResult("cancel");
                      setScreenshot(null);
                    }}
                  />
                </div>

                {selectedResult === "win" && (
                  <div>
                    <p className="mb-2 text-sm font-bold text-slate-600">
                      Upload winning screenshot
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setScreenshot(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                    />
                  </div>
                )}

                {selectedResult === "loss" && (
                  <InfoBox text="Loss submit karne ke liye screenshot ki zarurat nahi hai." />
                )}

                {selectedResult === "cancel" && (
                  <InfoBox text="Cancel tabhi complete hoga jab dono users cancel submit karenge." />
                )}

                <button
                  disabled={loading}
                  onClick={submitResult}
                  className="w-full rounded-xl bg-orange-500 py-3 font-black text-white disabled:opacity-60"
                >
                  {loading ? "Submitting..." : "Submit Result"}
                </button>
              </div>
            )}

            {myResultSubmitted &&
              ["running", "room_submitted", "result_submitted", "cancel_requested"].includes(
                String(battle.status || "").toLowerCase()
              ) && (
                <StatusBox
                  color="yellow"
                  text="Aapka result submit ho chuka hai. Dusre user/admin ka wait hai."
                />
              )}

            {battle.status === "result_submitted" && (
              <StatusBox
                color="yellow"
                text="Result submitted. Admin approval pending."
              />
            )}

            {battle.status === "cancel_requested" && (
              <StatusBox
                color="yellow"
                text="Cancel request submitted. Dusre user ka wait hai."
              />
            )}

            {battle.status === "approved" && (
              <StatusBox
                color="green"
                text="Winner Approved ✅ Prize Added in winning wallet."
              />
            )}

            {battle.status === "rejected" && (
              <StatusBox color="red" text="Battle rejected / refunded by admin." />
            )}

            {battle.status === "cancelled" && (
              <StatusBox color="red" text="Battle cancelled." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ text }) {
  return (
    <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-center text-sm font-black text-yellow-800">
      {text}
    </div>
  );
}

function StatusBox({ text, color }) {
  const cls =
    color === "green"
      ? "bg-green-600 text-white"
      : color === "red"
      ? "bg-red-600 text-white"
      : "bg-yellow-400 text-black";

  return (
    <div className={`rounded-xl p-3 text-center font-black ${cls}`}>
      {text}
    </div>
  );
}

function ResultButton({ text, active, color, onClick }) {
  const base =
    color === "green"
      ? "bg-green-600"
      : color === "red"
      ? "bg-red-600"
      : "bg-slate-700";

  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-3 font-black text-white ${base} ${
        active ? "ring-4 ring-yellow-300" : "opacity-80"
      }`}
    >
      {text}
    </button>
  );
}