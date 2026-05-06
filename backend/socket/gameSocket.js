const jwt = require("jsonwebtoken");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const Match = require("../models/match");

const BOARD_END = 57;
const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const FORCE_DICE_6 = false;
const MOVE_TIME = 10000;
const DISCONNECT_GRACE_TIME = 30000;

const rooms = {};

const START_OFFSET = {
  green: 0,
  yellow: 13,
  blue: 26,
  red: 39,
};

function initTokens(players) {
  const state = {};
  players.forEach((p) => {
    state[p.userId] = {
      color: p.color,
      tokens: [-1, -1, -1, -1],
      finished: 0,
    };
  });
  return state;
}

async function getUserFromToken(token) {
  try {
    if (!token) return null;
    token = String(token).replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
}

async function lockEntryAmount(userId, amount, roomId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new Error("Wallet not found");

  if (Number(wallet.balance || 0) < amount) {
    throw new Error("Insufficient balance");
  }

  wallet.balance = Number(wallet.balance || 0) - amount;
  wallet.locked = Number(wallet.locked || 0) + amount;
  await wallet.save();

  await Transaction.create({
    userId,
    amount,
    type: "game_entry",
    status: "success",
    note: "Game entry fee locked",
    roomId,
    balanceAfter: wallet.balance,
  });
}

async function giveReferralCommission(winnerUserId, winAmount, roomId) {
  try {
    const winnerUser = await User.findById(winnerUserId);

    if (!winnerUser || !winnerUser.referredBy) return;

    const referrer = await User.findById(winnerUser.referredBy);
    if (!referrer) return;

    const referralAmount = Math.floor(Number(winAmount || 0) * 0.02);

    if (referralAmount <= 0) return;

    let refWallet = await Wallet.findOne({ userId: referrer._id });

    if (!refWallet) {
      refWallet = await Wallet.create({
        userId: referrer._id,
        balance: 0,
        bonus: 0,
        winnings: 0,
        referralBalance: 0,
        locked: 0,
      });
    }

    refWallet.referralBalance =
      Number(refWallet.referralBalance || 0) + referralAmount;

    refWallet.balance = Number(refWallet.balance || 0) + referralAmount;

    referrer.totalReferralEarning =
      Number(referrer.totalReferralEarning || 0) + referralAmount;

    await refWallet.save();
    await referrer.save();

    await Transaction.create({
      userId: referrer._id,
      amount: referralAmount,
      type: "bonus",
      status: "success",
      note: `2% referral commission from winner ${winnerUser.phone || winnerUser.name}`,
      roomId,
      balanceAfter: refWallet.balance,
    });

    console.log("✅ Referral commission added:", {
      referrer: String(referrer._id),
      winner: String(winnerUser._id),
      amount: referralAmount,
      roomId,
    });
  } catch (err) {
    console.log("❌ REFERRAL COMMISSION ERROR:", err.message);
  }
}

function rollDiceValue() {
  return FORCE_DICE_6 ? 6 : Math.floor(Math.random() * 6) + 1;
}

function currentPlayer(room) {
  return room.players[room.turn];
}

function currentTurnId(room) {
  return currentPlayer(room)?.userId || "";
}

function clearMoveTimer(room) {
  if (room.moveTimer) {
    clearTimeout(room.moveTimer);
    room.moveTimer = null;
  }
}

function emitGame(io, roomId, room) {
  io.to(roomId).emit("stateUpdate", {
    state: room.state,
    currentTurn: currentTurnId(room),
  });

  io.to(roomId).emit("turnUpdate", {
    currentTurn: currentTurnId(room),
  });
}

function canMove(pos, dice) {
  if (pos === -1) return dice === 6;
  return pos + dice <= BOARD_END;
}

function getMovableTokens(room, player, dice) {
  const tokens = room.state[player.userId]?.tokens || [];

  return tokens
    .map((pos, index) => ({ pos, index }))
    .filter((t) => canMove(t.pos, dice))
    .map((t) => t.index);
}

function nextTurn(room) {
  clearMoveTimer(room);
  room.lastDice = null;
  room.turn = (room.turn + 1) % room.players.length;
}

function movePosition(pos, dice) {
  if (pos === -1 && dice === 6) return 0;
  if (pos >= 0 && pos + dice <= BOARD_END) return pos + dice;
  return null;
}

function boardCell(pos, color) {
  if (pos < 0 || pos >= 52) return null;
  return (pos + (START_OFFSET[color] || 0)) % 52;
}

function cutOpponentTokens(room, player, newPos) {
  if (newPos < 0 || newPos >= 52) {
    return { killed: false, killedTokens: [] };
  }

  const playerColor = room.state[player.userId]?.color || player.color;
  const newCell = boardCell(newPos, playerColor);

  if (newCell === null || SAFE_CELLS.has(newCell)) {
    return { killed: false, killedTokens: [] };
  }

  const killedTokens = [];

  room.players.forEach((opponent) => {
    if (opponent.userId === player.userId) return;

    const opponentState = room.state[opponent.userId];
    if (!opponentState) return;

    const opponentColor = opponentState.color || opponent.color;

    opponentState.tokens = opponentState.tokens.map((pos, index) => {
      const opponentCell = boardCell(pos, opponentColor);

      if (opponentCell !== null && opponentCell === newCell) {
        killedTokens.push({
          userId: opponent.userId,
          tokenIndex: index,
          from: pos,
          to: -1,
        });
        return -1;
      }

      return pos;
    });
  });

  return {
    killed: killedTokens.length > 0,
    killedTokens,
  };
}

async function createMatchInDB(roomId, user, player1, player2, amount) {
  await Match.create({
    roomId,
    players: [
      {
        userId: user._id,
        username: player1.username,
        amount,
        color: player1.color,
        isBot: false,
      },
      {
        userId: null,
        username: player2.username,
        amount,
        color: player2.color,
        isBot: true,
      },
    ],
    entryFee: amount,
    playersLimit: 2,
    status: "running",
    prizePool: amount * 2,
    startedAt: new Date(),
  });
}

async function finishGame(io, roomId, winnerPlayer, finishReason = "Game completed") {
  const room = rooms[roomId];
  if (!room) return;

  clearMoveTimer(room);

  const winner = winnerPlayer.userId;

  const entryAmount = Number(winnerPlayer.amount || 0);
  const prizePool = room.players.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const winAmount = Math.floor(prizePool * 0.9);
  const commission = Math.max(0, prizePool - winAmount);

  for (const p of room.players) {
    if (p.isBot) continue;

    const wallet = await Wallet.findOne({ userId: p.userId });
    if (!wallet) continue;

    wallet.locked = Math.max(
      0,
      Number(wallet.locked || 0) - Number(p.amount || 0)
    );

    if (String(p.userId) === String(winner)) {
      wallet.winnings = Number(wallet.winnings || 0) + winAmount;
      wallet.balance = Number(wallet.balance || 0) + winAmount;

      await wallet.save();

      await Transaction.create({
        userId: winner,
        amount: winAmount,
        type: "game_win",
        status: "success",
        note: finishReason,
        roomId,
        balanceAfter: wallet.balance,
      });

      await giveReferralCommission(winner, winAmount, roomId);
    } else {
      await wallet.save();

      await Transaction.create({
        userId: p.userId,
        amount: Number(p.amount || 0),
        type: "game_entry",
        status: "success",
        note: "Game lost / exited - no refund",
        roomId,
        balanceAfter: wallet.balance,
      });
    }
  }

  await Match.findOneAndUpdate(
    { roomId },
    {
      status: "completed",
      winner: {
        userId: winnerPlayer.isBot ? null : winnerPlayer.userId,
        username: winnerPlayer.username || "Winner",
      },
      winAmount,
      prizePool,
      commission,
      completedAt: new Date(),
      completedReason: finishReason,
    },
    { new: true }
  );

  io.to(roomId).emit("gameOver", {
    winner,
    entryAmount,
    prizePool,
    winAmount,
    commission,
    reason: finishReason,
  });

  delete rooms[roomId];
}

async function forfeitGame(io, roomId, loserPlayer, reason = "Player exited") {
  const room = rooms[roomId];
  if (!room || !loserPlayer) return;

  clearMoveTimer(room);

  const winnerPlayer = room.players.find(
    (p) => String(p.userId) !== String(loserPlayer.userId)
  );

  if (!winnerPlayer) return;

  io.to(roomId).emit("playerForfeited", {
    loser: loserPlayer.userId,
    winner: winnerPlayer.userId,
    msg: "Player exited. Entry fee refund nahi hoga.",
  });

  await finishGame(io, roomId, winnerPlayer, reason);
}

function startMoveTimer(io, roomId, room, player) {
  clearMoveTimer(room);

  io.to(roomId).emit("moveTimerStarted", {
    userId: player.userId,
    seconds: 10,
  });

  room.moveTimer = setTimeout(() => {
    const latestRoom = rooms[roomId];
    if (!latestRoom) return;

    const latestPlayer = currentPlayer(latestRoom);
    if (!latestPlayer || latestPlayer.userId !== player.userId) return;

    latestRoom.lastDice = null;
    nextTurn(latestRoom);
    emitGame(io, roomId, latestRoom);

    const next = currentPlayer(latestRoom);
    if (next?.isBot) setTimeout(() => botPlay(io, roomId), 900);
  }, MOVE_TIME);
}

async function moveTokenLogic(io, roomId, player, tokenIndex, socket = null) {
  const room = rooms[roomId];
  if (!room) return;

  clearMoveTimer(room);

  const dice = room.lastDice;
  if (!dice) return;

  const playerState = room.state[player.userId];
  if (!playerState) return;

  const oldPos = playerState.tokens[tokenIndex];
  const newPos = movePosition(oldPos, dice);

  if (newPos === null) {
    if (socket) socket.emit("battleError", { msg: "Ye goti move nahi ho sakti" });
    return;
  }

  io.to(roomId).emit("tokenMoveStart", {
    userId: player.userId,
    tokenIndex,
    from: oldPos,
    to: newPos,
    dice,
  });

  playerState.tokens[tokenIndex] = newPos;

  const cutResult = cutOpponentTokens(room, player, newPos);
  const killed = cutResult.killed;

  if (killed) {
    io.to(roomId).emit("tokenKilled", {
      byUserId: player.userId,
      killedTokens: cutResult.killedTokens,
    });
  }

  if (newPos === BOARD_END) {
    playerState.finished += 1;

    if (playerState.finished >= 4) {
      await finishGame(io, roomId, player, "Game completed");
      return;
    }
  }

  room.lastDice = null;

  const extraTurn = dice === 6 || killed || newPos === BOARD_END;

  if (extraTurn) {
    io.to(roomId).emit("bonusTurn", {
      userId: player.userId,
      reason: dice === 6 ? "six" : killed ? "kill" : "home",
    });
  } else {
    nextTurn(room);
  }

  setTimeout(() => {
    const latestRoom = rooms[roomId];
    if (!latestRoom) return;

    emitGame(io, roomId, latestRoom);

    const next = currentPlayer(latestRoom);
    if (next?.isBot) setTimeout(() => botPlay(io, roomId), 900);
  }, Math.max(600, dice * 230));
}

async function botPlay(io, roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const bot = currentPlayer(room);
  if (!bot?.isBot) return;

  const dice = rollDiceValue();
  room.lastDice = dice;

  io.to(roomId).emit("diceResult", {
    dice,
    userId: bot.userId,
  });

  setTimeout(async () => {
    const latestRoom = rooms[roomId];
    if (!latestRoom) return;

    const latestBot = currentPlayer(latestRoom);
    if (!latestBot?.isBot) return;

    const movable = getMovableTokens(latestRoom, latestBot, dice);

    if (movable.length === 0) {
      io.to(roomId).emit("noMove", { userId: latestBot.userId });

      nextTurn(latestRoom);
      emitGame(io, roomId, latestRoom);

      const next = currentPlayer(latestRoom);
      if (next?.isBot) setTimeout(() => botPlay(io, roomId), 900);
      return;
    }

    const selectedToken = chooseBestBotToken(latestRoom, latestBot, movable, dice);
    await moveTokenLogic(io, roomId, latestBot, selectedToken);
  }, 1000);
}

function chooseBestBotToken(room, bot, movable, dice) {
  const tokens = room.state[bot.userId]?.tokens || [];

  const finishingToken = movable.find(
    (index) => tokens[index] + dice === BOARD_END
  );
  if (finishingToken !== undefined) return finishingToken;

  const openToken = movable.find((index) => tokens[index] === -1);
  if (openToken !== undefined) return openToken;

  let best = movable[0];
  let bestPos = tokens[best];

  movable.forEach((index) => {
    if (tokens[index] > bestPos) {
      best = index;
      bestPos = tokens[index];
    }
  });

  return best;
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🎮 GAME SOCKET CONNECTED:", socket.id);

    socket.on("joinBattle", async ({ amount, token }) => {
      try {
        amount = Number(amount);

        if (!amount || amount < 10) {
          return socket.emit("battleError", { msg: "Invalid amount" });
        }

        const user = await getUserFromToken(token);

        if (!user) return socket.emit("battleError", { msg: "Login required" });

        if (user.status === "blocked") {
          return socket.emit("battleError", { msg: "Account blocked" });
        }

        const roomId = "room_" + Date.now();

        await lockEntryAmount(user._id, amount, roomId);

        const player1 = {
          socketId: socket.id,
          userId: String(user._id),
          username: user.name || user.phone || "Player",
          amount,
          isBot: false,
          color: "red",
          disconnectedAt: null,
        };

        const player2 = {
          socketId: "bot",
          userId: "bot_" + Date.now(),
          username: "Bot Player",
          amount,
          isBot: true,
          color: "yellow",
          disconnectedAt: null,
        };

        rooms[roomId] = {
          players: [player1, player2],
          turn: 0,
          lastDice: null,
          moveTimer: null,
          state: initTokens([player1, player2]),
        };

        await createMatchInDB(roomId, user, player1, player2, amount);

        socket.join(roomId);

        socket.emit("matchFound", {
          roomId,
          players: [player1, player2],
        });

        io.to(roomId).emit("gameStarted", {
          roomId,
          players: [player1, player2],
          currentTurn: player1.userId,
          state: rooms[roomId].state,
        });

        emitGame(io, roomId, rooms[roomId]);

        console.log("✅ Match started:", roomId);
      } catch (err) {
        console.log("❌ JOIN BATTLE ERROR:", err.message);
        socket.emit("battleError", { msg: err.message });
      }
    });

    socket.on("joinRoom", async ({ roomId, token }) => {
      try {
        const room = rooms[roomId];

        if (!room) return socket.emit("battleError", { msg: "Room not found" });

        const user = await getUserFromToken(token);

        if (!user) return socket.emit("battleError", { msg: "Login required" });

        if (user.status === "blocked") {
          return socket.emit("battleError", { msg: "Account blocked" });
        }

        const player = room.players.find(
          (p) => !p.isBot && String(p.userId) === String(user._id)
        );

        if (!player) {
          return socket.emit("battleError", {
            msg: "You are not allowed to join this room",
          });
        }

        player.socketId = socket.id;
        player.disconnectedAt = null;

        socket.join(roomId);

        socket.emit("gameStarted", {
          roomId,
          players: room.players,
          currentTurn: currentTurnId(room),
          state: room.state,
        });

        socket.emit("turnUpdate", {
          currentTurn: currentTurnId(room),
        });

        io.to(roomId).emit("playerReconnected", {
          userId: player.userId,
          msg: `${player.username || "Player"} reconnected`,
        });

        console.log("✅ Player rejoined room safely:", roomId, player.userId);
      } catch (err) {
        console.log("❌ JOIN ROOM ERROR:", err.message);
        socket.emit("battleError", {
          msg: err.message || "Join room failed",
        });
      }
    });

    socket.on("rollDice", ({ roomId }) => {
      const room = rooms[roomId];

      if (!room) return socket.emit("battleError", { msg: "Room not found" });

      const player = currentPlayer(room);

      if (!player || player.isBot || player.socketId !== socket.id) {
        return socket.emit("battleError", { msg: "Not your turn" });
      }

      if (room.lastDice) {
        return socket.emit("battleError", {
          msg: "Already rolled. Move token.",
        });
      }

      const dice = rollDiceValue();
      room.lastDice = dice;

      io.to(roomId).emit("diceResult", {
        dice,
        userId: player.userId,
      });

      const movable = getMovableTokens(room, player, dice);

      if (movable.length === 0) {
        io.to(roomId).emit("noMove", { userId: player.userId });

        setTimeout(() => {
          const latestRoom = rooms[roomId];
          if (!latestRoom) return;

          latestRoom.lastDice = null;
          nextTurn(latestRoom);
          emitGame(io, roomId, latestRoom);

          const next = currentPlayer(latestRoom);
          if (next?.isBot) setTimeout(() => botPlay(io, roomId), 900);
        }, 900);

        return;
      }

      startMoveTimer(io, roomId, room, player);
    });

    socket.on("moveToken", async ({ roomId, tokenIndex }) => {
      const room = rooms[roomId];

      if (!room) return socket.emit("battleError", { msg: "Room not found" });

      const player = currentPlayer(room);

      if (!player || player.isBot || player.socketId !== socket.id) {
        return socket.emit("battleError", { msg: "Not your turn" });
      }

      if (!room.lastDice) {
        return socket.emit("battleError", { msg: "Roll dice first" });
      }

      tokenIndex = Number(tokenIndex);

      if (tokenIndex < 0 || tokenIndex > 3) {
        return socket.emit("battleError", { msg: "Invalid token" });
      }

      const movable = getMovableTokens(room, player, room.lastDice);

      if (!movable.includes(tokenIndex)) {
        return socket.emit("battleError", {
          msg: "Ye goti move nahi ho sakti",
        });
      }

      await moveTokenLogic(io, roomId, player, tokenIndex, socket);
    });

    socket.on("forfeitGame", async ({ roomId }) => {
      try {
        const room = rooms[roomId];

        if (!room) return socket.emit("battleError", { msg: "Room not found" });

        const player = room.players.find(
          (p) => !p.isBot && p.socketId === socket.id
        );

        if (!player) {
          return socket.emit("battleError", { msg: "Player not found" });
        }

        await forfeitGame(io, roomId, player, "Player exited manually - no refund");
      } catch (err) {
        console.log("❌ FORFEIT ERROR:", err.message);
        socket.emit("battleError", { msg: "Exit failed" });
      }
    });

    socket.on("disconnect", async () => {
      console.log("❌ GAME SOCKET DISCONNECTED:", socket.id);

      for (const roomId in rooms) {
        const room = rooms[roomId];

        const index = room.players.findIndex(
          (p) => !p.isBot && p.socketId === socket.id
        );

        if (index === -1) continue;

        const player = room.players[index];

        player.disconnectedAt = Date.now();
        player.socketId = null;

        io.to(roomId).emit("playerDisconnected", {
          userId: player.userId,
          seconds: 30,
          msg: `${player.username || "Player"} disconnected. Waiting to reconnect...`,
        });

        setTimeout(async () => {
          const latestRoom = rooms[roomId];
          if (!latestRoom) return;

          const latestPlayer = latestRoom.players.find(
            (p) => !p.isBot && String(p.userId) === String(player.userId)
          );

          if (!latestPlayer) return;

          if (latestPlayer.socketId) {
            console.log("✅ Player reconnected, no loss:", roomId);
            return;
          }

          await forfeitGame(
            io,
            roomId,
            latestPlayer,
            `${latestPlayer.username || "Player"} disconnected - no refund`
          );

          console.log("✅ Match forfeited. No refund:", roomId);
        }, DISCONNECT_GRACE_TIME);

        break;
      }
    });
  });
};
