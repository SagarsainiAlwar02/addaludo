import { useEffect, useMemo, useState } from "react";
import { socket } from "../Socket";
import { useParams, useNavigate } from "react-router-dom";
import Board from "../components/board";
import Dice from "../components/dice";

function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [dice, setDice] = useState(null);
  const [players, setPlayers] = useState([]);
  const [state, setState] = useState({});
  const [turn, setTurn] = useState("");
  const [winner, setWinner] = useState(null);
  const [mySocketId, setMySocketId] = useState(socket.id || "");
  const [moveTimer, setMoveTimer] = useState(0);
  const [timerUserId, setTimerUserId] = useState("");
  const [tokenMove, setTokenMove] = useState(null);
  const [toast, setToast] = useState("");
  const [soundOn, setSoundOn] = useState(true);

  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const savedUserId =
    localStorage.getItem("userId") ||
    localStorage.getItem("_id") ||
    localStorage.getItem("id") ||
    "";

  const myPlayer = useMemo(() => {
    return players.find(
      (p) =>
        String(p.socketId) === String(mySocketId) ||
        String(p.userId) === String(savedUserId)
    );
  }, [players, mySocketId, savedUserId]);

  const myUserId = myPlayer?.userId || savedUserId || "";

  const isMyTurn =
    String(turn) === String(myUserId) || String(turn) === String(mySocketId);

  const prizePool = players.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const exitMatch = () => {
    const ok = window.confirm(
      "Match exit karoge to entry fee refund nahi hogi. Exit karna hai?"
    );

    if (!ok) return;

    socket.emit("forfeitGame", { roomId });

    setTimeout(() => {
      navigate("/battle");
    }, 300);
  };

  useEffect(() => {
    if (!roomId) return;

    const joinGameRoom = () => {
      setMySocketId(socket.id || "");
      socket.emit("joinRoom", {
        roomId,
        token: localStorage.getItem("token"),
      });
    };

    if (socket.connected) joinGameRoom();

    const onConnect = () => {
      setMySocketId(socket.id);
      joinGameRoom();
    };

    const onGameStarted = (data) => {
      setPlayers(data?.players || []);
      setState(data?.state || {});
      setTurn(String(data?.currentTurn || ""));
      setDice(null);
      setMoveTimer(0);
      setTimerUserId("");
      setTokenMove(null);
      setWinner(null);
      setScreenshot(null);
      setUploaded(false);
    };

    const onDiceResult = (data) => {
      setDice(Number(data?.dice) || null);
    };

    const onTokenMoveStart = (data) => {
      setTokenMove({ ...data, id: Date.now() });
    };

    const onStateUpdate = (data) => {
      setState(data?.state || {});
      setTurn(String(data?.currentTurn || ""));
      setDice(null);
      setMoveTimer(0);
      setTimerUserId("");
    };

    const onTurnUpdate = (data) => {
      setTurn(String(data?.currentTurn || ""));
    };

    const onMoveTimerStarted = (data) => {
      setTimerUserId(String(data?.userId || ""));
      setMoveTimer(Number(data?.seconds || 10));
    };

    const onTokenKilled = () => showToast("🔥 Goti killed!");
    const onBonusTurn = () => showToast("⚡ Bonus turn!");
    const onNoMove = () => showToast("❌ No move available");
    const onGameOver = (data) => setWinner(data || null);
    const onBattleError = (data) => showToast(data?.msg || "Game error");

    const onPlayerForfeited = (data) => {
      showToast(data?.msg || "Player exited. No refund.");
    };

    socket.on("connect", onConnect);
    socket.on("gameStarted", onGameStarted);
    socket.on("diceResult", onDiceResult);
    socket.on("tokenMoveStart", onTokenMoveStart);
    socket.on("stateUpdate", onStateUpdate);
    socket.on("turnUpdate", onTurnUpdate);
    socket.on("moveTimerStarted", onMoveTimerStarted);
    socket.on("tokenKilled", onTokenKilled);
    socket.on("bonusTurn", onBonusTurn);
    socket.on("noMove", onNoMove);
    socket.on("gameOver", onGameOver);
    socket.on("battleError", onBattleError);
    socket.on("playerForfeited", onPlayerForfeited);

    return () => {
      socket.off("connect", onConnect);
      socket.off("gameStarted", onGameStarted);
      socket.off("diceResult", onDiceResult);
      socket.off("tokenMoveStart", onTokenMoveStart);
      socket.off("stateUpdate", onStateUpdate);
      socket.off("turnUpdate", onTurnUpdate);
      socket.off("moveTimerStarted", onMoveTimerStarted);
      socket.off("tokenKilled", onTokenKilled);
      socket.off("bonusTurn", onBonusTurn);
      socket.off("noMove", onNoMove);
      socket.off("gameOver", onGameOver);
      socket.off("battleError", onBattleError);
      socket.off("playerForfeited", onPlayerForfeited);
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (moveTimer <= 0) return;

    const interval = setInterval(() => {
      setMoveTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [moveTimer]);

  const rollDice = () => {
    if (!roomId) return;
    if (!isMyTurn) return showToast("Abhi tumhari turn nahi hai");
    if (dice) return showToast("Token move karo");

    socket.emit("rollDice", { roomId });
  };

  const moveToken = (i) => {
    if (!dice) return showToast("Pehle dice roll karo");
    if (!isMyTurn) return showToast("Abhi tumhari turn nahi hai");

    socket.emit("moveToken", { roomId, tokenIndex: i });
  };

  const uploadScreenshot = async () => {
    if (!screenshot) {
      return showToast("Screenshot select karo");
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("screenshot", screenshot);
      formData.append("roomId", roomId);
      formData.append("entryAmount", winner?.entryAmount || 0);
      formData.append("prizePool", winner?.prizePool || prizePool || 0);
      formData.append("winAmount", winner?.winAmount || 0);

      const res = await fetch("http://localhost:5000/api/match-proof/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.msg || "Screenshot upload failed");
      }

      setUploaded(true);
      showToast("Screenshot uploaded ✅");
    } catch (err) {
      console.log(err);
      showToast(err.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const player1 = players[0];
  const player2 = players[1];
  const isWinnerMe = String(winner?.winner) === String(myUserId);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050816] via-[#0d47a1] to-[#020617] text-white">
      <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle,white_0_2px,transparent_3px)] bg-[length:48px_48px]" />

      <div className="relative z-10 px-3 py-3 pb-36">
        <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between rounded-3xl border border-white/15 bg-black/40 px-4 py-3 shadow-2xl backdrop-blur">
          <button
            onClick={exitMatch}
            className="rounded-2xl bg-red-600 px-4 py-2 font-black hover:bg-red-700"
          >
            ← Exit
          </button>

          <div className="text-center">
            <p className="text-[11px] text-white/60">Room ID</p>
            <p className="max-w-[160px] truncate text-xs font-black">
              {roomId}
            </p>
          </div>

          <div className="rounded-2xl bg-yellow-400 px-4 py-2 text-center text-black">
            <p className="text-[11px] font-bold">Prize Pool</p>
            <p className="text-sm font-black">₹{prizePool}</p>
          </div>

          <button
            onClick={() => setSoundOn((p) => !p)}
            className="rounded-2xl bg-white/15 px-4 py-2 font-black"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>

          <div
            className={`rounded-full px-4 py-2 text-xs font-black shadow-xl sm:text-sm ${
              isMyTurn ? "animate-pulse bg-green-500" : "bg-red-500"
            }`}
          >
            {isMyTurn ? "YOUR TURN" : "OPPONENT TURN"}
          </div>
        </div>

        <div className="mx-auto mb-3 max-w-7xl rounded-2xl border border-red-400/40 bg-red-600/20 px-4 py-3 text-center text-sm font-black text-red-100">
          ⚠️ Match join ke baad exit/disconnect par refund nahi hoga.
        </div>

        {toast && (
          <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-black/80 px-6 py-3 text-sm font-black shadow-2xl">
            {toast}
          </div>
        )}

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 lg:grid-cols-[230px_1fr_230px]">
          <PlayerPanel
            player={player2}
            fallback="Bot Player"
            active={String(turn) === String(player2?.userId)}
            timer={
              String(timerUserId) === String(player2?.userId) ? moveTimer : 0
            }
          />

          <Board
            state={state}
            players={players}
            dice={dice}
            isMyTurn={isMyTurn}
            myUserId={myUserId}
            tokenMove={tokenMove}
            onMoveToken={moveToken}
            soundOn={soundOn}
          />

          <div className="space-y-4">
            <PlayerPanel
              player={player1}
              fallback="Player 1"
              active={String(turn) === String(player1?.userId)}
              timer={
                String(timerUserId) === String(player1?.userId) ? moveTimer : 0
              }
            />

            <div className="rounded-3xl border border-white/15 bg-black/40 p-4 shadow-2xl backdrop-blur">
              <Dice
                dice={dice}
                onRoll={rollDice}
                isMyTurn={isMyTurn}
                timer={String(timerUserId) === String(myUserId) ? moveTimer : 0}
                soundOn={soundOn}
              />
            </div>
          </div>
        </div>
      </div>

      {winner && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center text-black shadow-2xl">
            <div className="mb-3 text-6xl">{isWinnerMe ? "🏆" : "😢"}</div>

            <h2 className="mb-2 text-3xl font-black">
              {isWinnerMe ? "You Win!" : "You Lose"}
            </h2>

            <p className="text-sm font-bold text-black/50">
              {winner?.reason || (isWinnerMe ? "Congratulations bhai!" : "Next match me comeback!")}
            </p>

            <div className="my-5 space-y-3 rounded-2xl bg-zinc-100 p-4 text-left">
              <div className="flex justify-between font-bold">
                <span>Entry Fee</span>
                <span>₹{winner.entryAmount || 0}</span>
              </div>

              <div className="flex justify-between font-bold">
                <span>Prize Pool</span>
                <span>₹{winner.prizePool || 0}</span>
              </div>

              <div className="flex justify-between border-t border-black/10 pt-3 text-xl font-black text-green-600">
                <span>You Won</span>
                <span>₹{isWinnerMe ? winner.winAmount || 0 : 0}</span>
              </div>
            </div>

            {!isWinnerMe && (
              <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
                Entry fee refund nahi hogi.
              </div>
            )}

            {isWinnerMe && (
              <div className="mb-4 rounded-2xl border-2 border-dashed border-green-400 bg-green-50 p-4 text-left">
                <p className="mb-2 text-sm font-black text-green-700">
                  Winning Screenshot Upload
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  disabled={uploaded || uploading}
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-black/10 bg-white p-2 text-sm"
                />

                {screenshot && !uploaded && (
                  <p className="mt-2 truncate text-xs font-bold text-black/60">
                    Selected: {screenshot.name}
                  </p>
                )}

                {uploaded ? (
                  <div className="mt-3 rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-black text-white">
                    Screenshot Uploaded ✅
                  </div>
                ) : (
                  <button
                    onClick={uploadScreenshot}
                    disabled={uploading}
                    className="mt-3 w-full rounded-2xl bg-green-600 px-4 py-3 font-black text-white disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Submit Screenshot"}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => navigate("/battle")}
              className="mt-2 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white"
            >
              Back to Battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerPanel({ player, fallback, active, timer }) {
  const color = player?.color || "red";

  const colorMap = {
    red: "from-red-600 to-red-800 border-red-400",
    yellow: "from-yellow-400 to-orange-500 border-yellow-300",
    green: "from-green-500 to-green-800 border-green-300",
    blue: "from-sky-400 to-blue-700 border-sky-300",
  };

  return (
    <div
      className={`rounded-3xl border-4 bg-gradient-to-br ${
        colorMap[color] || colorMap.red
      } p-4 shadow-2xl ${active ? "ring-4 ring-lime-300" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-black/25 text-2xl font-black">
          {(player?.username || fallback || "P")[0]}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black">
            {player?.username || fallback}
          </p>
          <p className="text-xs font-bold text-white/80">
            {active ? "Playing now" : "Waiting..."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-black/20 p-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="mx-auto h-10 w-10 rounded-full border-4 border-white bg-white/20 shadow-xl"
          />
        ))}
      </div>

      {timer > 0 && (
        <div className="mt-4 rounded-full bg-black/40 px-3 py-2 text-center text-sm font-black">
          ⏱ {timer}s
        </div>
      )}
    </div>
  );
}

export default Game;