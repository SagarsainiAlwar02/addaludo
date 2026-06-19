import GameRoom from "../models/GameRoom.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import { v4 as uuidv4 } from "uuid";

// ================= CREATE ROOM =================
export const createRoom = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    // ✅ Total usable balance: balance + bonus + winnings
    const totalBalance =
      Number(wallet.balance || 0) +
      Number(wallet.bonus || 0) +
      Number(wallet.winnings || 0);

    if (totalBalance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // ✅ Pehle balance se kaato, phir bonus, phir winnings
    let remaining = Number(amount);

    const fromBalance = Math.min(Number(wallet.balance || 0), remaining);
    remaining -= fromBalance;

    const fromBonus = Math.min(Number(wallet.bonus || 0), remaining);
    remaining -= fromBonus;

    const fromWinnings = Math.min(Number(wallet.winnings || 0), remaining);
    remaining -= fromWinnings;

    await Wallet.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: {
          balance: -fromBalance,
          bonus: -fromBonus,
          winnings: -fromWinnings,
          locked: amount,
        },
      }
    );

    await Transaction.create({
      userId: req.user._id,
      amount,
      type: "game_entry",
      status: "success",
      note: `Room entry fee (balance:${fromBalance}, bonus:${fromBonus}, winnings:${fromWinnings})`,
    });

    const roomId = "room_" + uuidv4();

    const room = await GameRoom.create({
      roomId,
      players: [
        {
          userId: req.user._id,
          socketId: "",
          amount,
          username: req.user.name || "Player",
        },
      ],
      status: "waiting",
    });

    res.json({ msg: "Room created", room });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= JOIN ROOM =================
export const joinRoom = async (req, res) => {
  try {
    const { roomId, socketId } = req.body;

    const room = await GameRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ msg: "Room not found" });

    if (room.players.length >= 2) {
      return res.status(400).json({ msg: "Room full" });
    }

    const entryAmount = Number(room.players[0].amount || 0);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    // ✅ Total usable balance: balance + bonus + winnings
    const totalBalance =
      Number(wallet.balance || 0) +
      Number(wallet.bonus || 0) +
      Number(wallet.winnings || 0);

    if (totalBalance < entryAmount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // ✅ Pehle balance se kaato, phir bonus, phir winnings
    let remaining = entryAmount;

    const fromBalance = Math.min(Number(wallet.balance || 0), remaining);
    remaining -= fromBalance;

    const fromBonus = Math.min(Number(wallet.bonus || 0), remaining);
    remaining -= fromBonus;

    const fromWinnings = Math.min(Number(wallet.winnings || 0), remaining);
    remaining -= fromWinnings;

    await Wallet.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: {
          balance: -fromBalance,
          bonus: -fromBonus,
          winnings: -fromWinnings,
          locked: entryAmount,
        },
      }
    );

    await Transaction.create({
      userId: req.user._id,
      amount: entryAmount,
      type: "game_entry",
      status: "success",
      note: `Room join fee (balance:${fromBalance}, bonus:${fromBonus}, winnings:${fromWinnings})`,
      roomId,
    });

    room.players.push({
      userId: req.user._id,
      socketId,
      amount: entryAmount,
      username: req.user.name || "Player2",
    });

    room.status = "ongoing";
    await room.save();

    res.json({ msg: "Joined room", room });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= GET ROOM =================
export const getRoom = async (req, res) => {
  try {
    const room = await GameRoom.findOne({ roomId: req.params.id });
    if (!room) return res.status(404).json({ msg: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= END GAME =================
export const endGame = async (req, res) => {
  try {
    const { roomId, winnerId, winAmount } = req.body;

    const room = await GameRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ msg: "Room not found" });

    if (room.status === "completed") {
      return res.status(400).json({ msg: "Game already ended" });
    }

    room.status = "completed";
    room.winner = winnerId;
    await room.save();

    // ✅ Winner ko winnings mein add karo
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId: winnerId },
      {
        $inc: {
          winnings: winAmount,
          locked: -winAmount,
        },
      },
      { new: true }
    );

    await Transaction.create({
      userId: winnerId,
      amount: winAmount,
      type: "game_win",
      status: "success",
      roomId,
      note: "Game win prize",
      balanceAfter: Number(updatedWallet?.winnings || 0),
    });

    res.json({ msg: "Game ended successfully", winnerId, winAmount });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};