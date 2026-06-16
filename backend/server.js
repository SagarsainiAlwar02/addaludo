import dns from "dns";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import axios from "axios";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import User from "./models/user.js";
import Wallet from "./models/wallet.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setDefaultResultOrder("ipv4first");

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}

function makeReferralCode() {
  return "BA-" + Math.floor(100000 + Math.random() * 900000);
}

async function generateUniqueReferralCode() {
  let code;
  let exists = true;

  while (exists) {
    code = makeReferralCode();
    exists = await User.findOne({ referralCode: code });
  }

  return code;
}

const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://addaludo.com",
  "https://www.addaludo.com",
  "https://api.addaludo.com",
  "https://addaludo-admin-6gkuvk98k-sagarsaini8003656-3610s-projects.vercel.app",
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_WWW,
  process.env.ADMIN_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "2mb",
}));
app.use("/uploads", express.static(uploadPath));

const server = http.createServer(app);

import { Server } from "socket.io";
import gameSocket from "./socket/gameSocket.js";

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

gameSocket(io);

import userAuthRoutes from "./routes/userAuth.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/admin.js";
import walletRoutes from "./routes/wallet.js";
import depositRoutes from "./routes/depositRoutes.js";
import redeemRoutes from "./routes/redeemRoutes.js";
import matchRoutes from "./routes/match.js";
import battleRoutes from "./routes/battleRoutes.js";
import adminBattleRoutes from "./routes/adminBattleRoutes.js";
import matchProofRoutes from "./routes/matchProofRoutes.js";
import kycRoutes from "./routes/kyc.js";
import authMiddleware from "./middleware/auth.js";
import { submitKyc } from "./controllers/kycController.js";

app.use("/api/user", userAuthRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/redeem", redeemRoutes);

app.use("/api/matches", matchRoutes);
app.use("/api/match", matchRoutes);

app.use("/api/battle", battleRoutes);
app.use("/api/admin/battles", adminBattleRoutes);
app.use("/api/match-proof", matchProofRoutes);

app.use("/api/kyc", kycRoutes);

app.post(
  "/api/user/kyc",
  authMiddleware,
  submitKyc
);

const otpStore = {};

setInterval(() => {
  const now = Date.now();

  Object.keys(otpStore).forEach((phone) => {
    if (now - otpStore[phone].createdAt > 5 * 60 * 1000) {
      delete otpStore[phone];
    }
  });
}, 60000);

app.post("/api/send-otp", async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        msg: "Phone number required",
      });
    }

    phone = String(phone).trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid phone number",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    otpStore[phone] = {
      otp,
      createdAt: Date.now(),
    };

    console.log("📲 OTP GENERATED:", phone, otp);


const smsResponse = await axios.post(
  "https://www.fast2sms.com/dev/bulkV2",
  {
    route: "otp",
    variables_values: otp,
    numbers: phone,
  },
  {
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
  }
);

console.log("✅ FAST2SMS RESPONSE:", smsResponse.data);

if (!smsResponse.data.return) {
  return res.status(500).json({
    success: false,
    msg: "SMS failed",
    error: smsResponse.data,
  });
}

return res.json({
  success: true,
  msg: "OTP sent successfully",
});

  } catch (err) {
    console.log("❌ 2FACTOR ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      msg: "Failed to send OTP",
      error: err.response?.data || err.message,
    });
  }
});

app.post("/api/otp-login", async (req, res) => {
  try {
    let { phone, otp, referralCode } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        msg: "Phone and OTP required",
      });
    }

    phone = String(phone).trim();
    otp = String(otp).trim();
    referralCode = referralCode ? String(referralCode).trim().toUpperCase() : "";

    const record = otpStore[phone];

    if (!record) {
      return res.status(400).json({
        success: false,
        msg: "OTP not found or expired",
      });
    }

    if (Date.now() - record.createdAt > 5 * 60 * 1000) {
      delete otpStore[phone];

      return res.status(400).json({
        success: false,
        msg: "OTP expired",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        msg: "Invalid OTP",
      });
    }

    delete otpStore[phone];

    let user = await User.findOne({ phone });

    if (!user) {
      let referredBy = null;

      if (referralCode) {
        const refUser = await User.findOne({ referralCode });

        if (!refUser) {
          return res.status(400).json({
            success: false,
            msg: "Invalid referral code",
          });
        }

        if (String(refUser.phone) === String(phone)) {
          return res.status(400).json({
            success: false,
            msg: "Self referral not allowed",
          });
        }

        referredBy = refUser._id;
      }

      user = await User.create({
        phone,
        name: "Player" + Math.floor(Math.random() * 1000),
        password: "nopassword",
        role: "user",
        status: "active",
        referralCode: await generateUniqueReferralCode(),
        referredBy,
      });

      console.log("✅ NEW USER CREATED:", user._id);
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        msg: "Account blocked",
      });
    }

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balance: 0,
        bonus: 0,
        winnings: 0,
        referralBalance: 0,
        locked: 0,
      });

      console.log("✅ WALLET CREATED:", wallet._id);
    }

    const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        role: user.role,
        status: user.status,
      },
      wallet,
    });
  } catch (err) {
    console.log("❌ OTP LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    msg: "Backend healthy",
    time: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: "Route not found",
    path: req.originalUrl,
  });
});

mongoose.set("strictQuery", true);
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "ludoDB",
  })
  .then(() => {
    console.log("✅ MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ DB ERROR:", err.message);
  });