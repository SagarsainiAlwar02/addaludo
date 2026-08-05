import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const BOARD_END = 57;

const COLORS = {
  green: "#00a82d",
  yellow: "#ffd21f",
  red: "#f21d2f",
  blue: "#32b9f3",
};

const DARK = {
  green: "#006b18",
  yellow: "#c99700",
  red: "#a50000",
  blue: "#0877a8",
};

const PLAYER_COLORS = ["red", "yellow", "green", "blue"];

const path = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

const START_OFFSET = { green: 0, yellow: 13, blue: 26, red: 39 };

const HOME_POS = {
  green: [[2, 2], [4, 2], [2, 4], [4, 4]],
  yellow: [[11, 2], [13, 2], [11, 4], [13, 4]],
  red: [[2, 11], [4, 11], [2, 13], [4, 13]],
  blue: [[11, 11], [13, 11], [11, 13], [13, 13]],
};

const HOME_LANE = {
  green: [[1.5, 7.5], [2.5, 7.5], [3.5, 7.5], [4.5, 7.5], [5.5, 7.5], [7.5, 7.5]],
  yellow: [[7.5, 1.5], [7.5, 2.5], [7.5, 3.5], [7.5, 4.5], [7.5, 5.5], [7.5, 7.5]],
  blue: [[13.5, 7.5], [12.5, 7.5], [11.5, 7.5], [10.5, 7.5], [9.5, 7.5], [7.5, 7.5]],
  red: [[7.5, 13.5], [7.5, 12.5], [7.5, 11.5], [7.5, 10.5], [7.5, 9.5], [7.5, 7.5]],
};

function playStepSound(soundOn = true) {
  if (!soundOn) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = 720;
    gain.gain.value = 0.04;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  } catch {}
}

function Board({
  state,
  players,
  dice,
  isMyTurn,
  myUserId,
  tokenMove,
  onMoveToken,
  soundOn = true,
}) {
  const [visualState, setVisualState] = useState(state || {});
  const [blast, setBlast] = useState(null);
  const animating = useRef(false);

  const activePlayers = useMemo(() => {
    return (players || []).map((p, i) => ({
      ...p,
      color: p.color || state?.[p.userId]?.color || PLAYER_COLORS[i] || "red",
    }));
  }, [players, state]);

  useEffect(() => {
    if (!state || !Object.keys(state).length) return;

    if (!visualState || !Object.keys(visualState).length) {
      setVisualState(state);
      return;
    }

    if (!animating.current) {
      setVisualState(state);
    }
    // eslint-disable-next-line
  }, [state]);

  useEffect(() => {
    if (!tokenMove) return;

    const runMove = async () => {
      const { userId, tokenIndex, from, to } = tokenMove;

      if (!userId || tokenIndex === undefined) return;

      animating.current = true;

      if (from === -1 && to === 0) {
        setVisualState((prev) => updateToken(prev, userId, tokenIndex, 0));
        playStepSound(soundOn);
        animating.current = false;
        return;
      }

      if (to === -1 || to <= from) {
        setVisualState(state);
        playStepSound(soundOn);
        animating.current = false;
        return;
      }

      for (let p = from + 1; p <= to; p++) {
        setVisualState((prev) => updateToken(prev, userId, tokenIndex, p));
        playStepSound(soundOn);
        await new Promise((res) => setTimeout(res, 280));
      }

      const player = activePlayers.find(
        (p) => String(p.userId) === String(userId)
      );

      if (player) {
        const [x, y] = getTokenPosition(to, player.color, tokenIndex);
        setBlast({ id: Date.now(), x, y });
        setTimeout(() => setBlast(null), 450);
      }

      animating.current = false;
    };

    runMove();
    // eslint-disable-next-line
  }, [tokenMove]);

  const stars = new Set(["6-2", "2-6", "8-12", "12-8"]);
  const arrows = { "7-0": "→", "0-7": "↓", "7-14": "←", "14-7": "↑" };

  return (
    <div className="relative mx-auto aspect-square w-[min(94vw,68vh,560px)] rounded-[28px] bg-gradient-to-br from-white/70 to-white/20 p-2 shadow-[0_25px_80px_rgba(0,0,0,.55)]">
      <div className="relative h-full w-full overflow-hidden rounded-[22px] border-[7px] border-white bg-white shadow-2xl">
        <div className="absolute inset-0 grid grid-cols-[repeat(15,1fr)] grid-rows-[repeat(15,1fr)]">
          {Array.from({ length: 225 }).map((_, i) => {
            const r = Math.floor(i / 15);
            const c = i % 15;
            const center = r >= 6 && r <= 8 && c >= 6 && c <= 8;

            return (
              <div
                key={i}
                className="relative border border-black/35"
                style={{ background: center ? "transparent" : cellColor(r, c) }}
              >
                {stars.has(`${r}-${c}`) && (
                  <span className="absolute inset-0 grid place-items-center text-2xl text-black/40 sm:text-3xl">
                    ★
                  </span>
                )}

                {arrows[`${r}-${c}`] && (
                  <span
                    className="absolute inset-0 grid place-items-center text-xl font-black sm:text-2xl"
                    style={{ color: cellColor(r, c) }}
                  >
                    {arrows[`${r}-${c}`]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <HomeBox color="green" className="left-0 top-0" />
        <HomeBox color="yellow" className="right-0 top-0" />
        <HomeBox color="red" className="bottom-0 left-0" />
        <HomeBox color="blue" className="bottom-0 right-0" />

        <div className="absolute left-[40%] top-[40%] z-20 h-[20%] w-[20%] overflow-hidden border border-black/30 bg-white">
          <div className="absolute inset-0 bg-[conic-gradient(from_45deg,#32b9f3_0_25%,#f21d2f_25%_50%,#00a82d_50%_75%,#ffd21f_75%_100%)]" />
          <div className="absolute inset-[18%] rounded-full border border-white/50 bg-black/20" />
        </div>

        {blast && (
          <motion.div
            key={blast.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-none absolute z-50 h-8 w-8 rounded-full border-4 border-yellow-300 bg-yellow-300/40"
            style={{
              left: `${(blast.x / 15) * 100}%`,
              top: `${(blast.y / 15) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {activePlayers.map((player) => {
          const pState = visualState?.[player.userId];
          if (!pState?.tokens) return null;

          return pState.tokens.map((pos, tokenIndex) => {
            const [x, y] = getTokenPosition(pos, player.color, tokenIndex);

            const canMove =
              isMyTurn &&
              dice &&
              String(player.userId) === String(myUserId) &&
              canTokenMove(pos, dice);

            const stackOffset = getStackOffset(
              visualState,
              activePlayers,
              player.userId,
              tokenIndex,
              pos
            );

            return (
              <motion.button
                key={`${player.userId}-${tokenIndex}`}
                onClick={() => canMove && onMoveToken(tokenIndex)}
                animate={{
                  left: `${((x + stackOffset.x) / 15) * 100}%`,
                  top: `${((y + stackOffset.y) / 15) * 100}%`,
                  x: "-50%",
                  y: "-50%",
                  scale: canMove ? 1.12 : 1,
                }}
                transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
                className={`absolute z-40 h-[5.9%] w-[5.9%] ${
                  canMove ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {canMove && (
                  <span className="absolute inset-[-8px] animate-ping rounded-full bg-lime-300/60" />
                )}

                <Token color={player.color} active={canMove} />
              </motion.button>
            );
          });
        })}
      </div>
    </div>
  );
}

function updateToken(prev, userId, tokenIndex, value) {
  const userState = prev?.[userId];
  if (!userState) return prev;

  return {
    ...prev,
    [userId]: {
      ...userState,
      tokens: userState.tokens.map((v, i) => (i === tokenIndex ? value : v)),
    },
  };
}

function cellColor(r, c) {
  if (r < 6 && c < 6) return COLORS.green;
  if (r < 6 && c > 8) return COLORS.yellow;
  if (r > 8 && c < 6) return COLORS.red;
  if (r > 8 && c > 8) return COLORS.blue;

  if (r === 7 && c >= 1 && c <= 5) return COLORS.green;
  if (c === 7 && r >= 1 && r <= 5) return COLORS.yellow;
  if (c === 7 && r >= 9 && r <= 13) return COLORS.red;
  if (r === 7 && c >= 9 && c <= 13) return COLORS.blue;

  return "#fff";
}

function getTokenPosition(pos, color, tokenIndex) {
  if (pos === -1) return HOME_POS[color]?.[tokenIndex] || [7.5, 7.5];

  if (pos >= 52) {
    return HOME_LANE[color]?.[pos - 52] || [7.5, 7.5];
  }

  const [r, c] = path[(pos + (START_OFFSET[color] || 0)) % 52];
  return [c + 0.5, r + 0.5];
}

function canTokenMove(pos, dice) {
  if (!dice) return false;
  if (pos === -1) return dice === 6;
  return pos + dice <= BOARD_END;
}

function getStackOffset(visualState, activePlayers, userId, tokenIndex, pos) {
  if (pos < 0) return { x: 0, y: 0 };

  const same = [];

  activePlayers.forEach((p) => {
    const tokens = visualState?.[p.userId]?.tokens || [];
    tokens.forEach((tPos, i) => {
      if (tPos === pos) same.push(`${p.userId}-${i}`);
    });
  });

  const index = same.indexOf(`${userId}-${tokenIndex}`);
  if (same.length <= 1 || index === -1) return { x: 0, y: 0 };

  const offsets = [
    { x: -0.11, y: -0.11 },
    { x: 0.11, y: -0.11 },
    { x: -0.11, y: 0.11 },
    { x: 0.11, y: 0.11 },
  ];

  return offsets[index % offsets.length];
}

function HomeBox({ color, className }) {
  return (
    <div
      className={`absolute z-10 grid h-[40%] w-[40%] place-items-center ${className}`}
      style={{ background: COLORS[color] }}
    >
      <div className="grid h-[66%] w-[66%] grid-cols-2 grid-rows-2 gap-4 rounded-2xl border-[4px] border-black/25 bg-white p-5 shadow-inner">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full border-[4px] border-black/20 bg-white shadow-inner"
          />
        ))}
      </div>
    </div>
  );
}

function Token({ color, active }) {
  return (
    <div className="relative h-full w-full">
      {active && (
        <div
          className="absolute inset-[-6px] rounded-full blur-md"
          style={{ background: COLORS[color] }}
        />
      )}

      <div className="absolute left-[18%] top-[68%] h-[24%] w-[64%] rounded-full bg-black/25 blur-[2px]" />

      <div
        className="absolute left-[10%] top-[4%] h-[84%] w-[80%] rounded-full border-[3px] border-white shadow-xl"
        style={{
          background: `radial-gradient(circle at 35% 25%, #fff 0 8%, ${COLORS[color]} 18%, ${DARK[color]} 100%)`,
        }}
      />

      <div className="absolute left-[30%] top-[20%] h-[24%] w-[24%] rounded-full bg-white/70" />

      <div
        className="absolute left-[35%] top-[67%] h-[20%] w-[30%] rounded-b-full border-x-[2px] border-b-[2px] border-white"
        style={{ background: DARK[color] }}
      />
    </div>
  );
}

export default Board;