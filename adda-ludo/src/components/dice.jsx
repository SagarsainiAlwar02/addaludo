import React, { useEffect, useState } from "react";

function playDiceSound(soundOn = true) {
  if (!soundOn) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = 520;
    gain.gain.value = 0.08;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    setTimeout(() => {
      osc.frequency.value = 760;
    }, 80);

    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

function Dice({ dice, onRoll, isMyTurn, timer, soundOn = true }) {
  const [rolling, setRolling] = useState(false);
  const [fakeDice, setFakeDice] = useState(1);

  const displayDice = rolling ? fakeDice : dice || 1;

  useEffect(() => {
    if (!rolling) return;

    const interval = setInterval(() => {
      setFakeDice(Math.floor(Math.random() * 6) + 1);
    }, 90);

    return () => clearInterval(interval);
  }, [rolling]);

  useEffect(() => {
    if (dice) setRolling(false);
  }, [dice]);

  const handleRoll = () => {
    if (!isMyTurn || rolling || dice) return;

    playDiceSound(soundOn);
    setRolling(true);
    onRoll();

    setTimeout(() => setRolling(false), 900);
  };

  const dots = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative grid place-items-center">
        {timer > 0 && (
          <div
            className="absolute h-32 w-32 rounded-full"
            style={{
              background: `conic-gradient(#fde047 ${timer * 36}deg, rgba(255,255,255,.18) 0deg)`,
            }}
          />
        )}

        <button
          onClick={handleRoll}
          disabled={!isMyTurn || rolling || !!dice}
          className={`relative grid h-24 w-24 grid-cols-3 grid-rows-3 rounded-[26px] border-[5px] border-white bg-gradient-to-br from-white via-zinc-100 to-zinc-400 p-4 shadow-2xl transition duration-300 ${
            rolling ? "animate-bounce rotate-12 scale-110" : ""
          } ${
            isMyTurn && !dice
              ? "cursor-pointer hover:scale-110"
              : "cursor-not-allowed opacity-70"
          }`}
        >
          <div className="absolute inset-0 rounded-[20px] bg-white/20 shadow-[inset_0_0_18px_rgba(0,0,0,.25)]" />

          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`relative z-10 m-auto h-4 w-4 rounded-full shadow ${
                dots[displayDice]?.includes(i) ? "bg-black" : "bg-transparent"
              }`}
            />
          ))}
        </button>
      </div>

      {dice && timer > 0 && (
        <div className="rounded-full bg-black/45 px-4 py-2 text-sm font-black text-yellow-300 shadow-xl">
          Move in {timer}s
        </div>
      )}

      <button
        disabled={!isMyTurn || rolling || !!dice}
        onClick={handleRoll}
        className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 px-5 py-3 font-black text-black shadow-xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {rolling ? "Rolling..." : dice ? "Move Token" : "Roll Dice"}
      </button>

      <p className="text-center text-xs font-bold text-white/60">
        {isMyTurn
          ? dice
            ? "Select your movable goti"
            : "Tap dice to roll"
          : "Waiting for opponent"}
      </p>
    </div>
  );
}

export default Dice;