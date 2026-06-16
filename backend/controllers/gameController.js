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

    const roomId = "room_" + uuidv4();

    const room = await GameRoom.create({
      roomId,
      players: [
        {
          userId: req.user._id,
          socketId: "",
          amount,
          username: req.user.name || "Player"
        }
      ],
      status: "waiting"
    });

    res.json({
      msg: "Room created",
      room
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= JOIN ROOM =================
export const joinRoom = async (req, res) => {
  try {
    const { roomId, socketId } = req.body;

    const room = await GameRoom.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ msg: "Room not found" });
    }

    if (room.players.length >= 2) {
      return res.status(400).json({ msg: "Room full" });
    }

    const entryAmount = room.players[0].amount;

    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet || wallet.balance < entryAmount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // 💰 deduct entry fee
    wallet.balance -= entryAmount;
    wallet.locked = (wallet.locked || 0) + entryAmount;

    await wallet.save();

    // 📜 transaction
    await Transaction.create({
      userId: req.user._id,
      amount: entryAmount,
      type: "game_entry",
      roomId
    });

    room.players.push({
      userId: req.user._id,
      socketId,
      amount: entryAmount,
      username: req.user.name || "Player2"
    });

    room.status = "ongoing";

    await room.save();

    res.json({
      msg: "Joined room",
      room
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= GET ROOM =================
export const getRoom = async (req, res) => {
  try {
    const room = await GameRoom.findOne({ roomId: req.params.id });

    if (!room) {
      return res.status(404).json({ msg: "Room not found" });
    }

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

    if (!room) {
      return res.status(404).json({ msg: "Room not found" });
    }

    if (room.status === "completed") {
      return res.status(400).json({ msg: "Game already ended" });
    }

    room.status = "completed";
    room.winner = winnerId;

    await room.save();

    const wallet = await Wallet.findOne({ userId: winnerId });

    if (wallet) {
      wallet.balance += winAmount;
      wallet.locked = Math.max(0, (wallet.locked || 0) - winAmount);

      await Transaction.create({
        userId: winnerId,
        amount: winAmount,
        type: "game_win",
        roomId
      });

      await wallet.save();
    }

    res.json({
      msg: "Game ended successfully",
      winnerId,
      winAmount
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};