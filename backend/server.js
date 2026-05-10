const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const User = require("./models/user");
const Wallet = require("./models/wallet");

const app = express();

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

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadPath));

const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

require("./socket/gameSocket")(io);

app.use("/api/user", require("./routes/userAuth"));
app.use("/api/admin-auth", require("./routes/adminAuth"));
app.use("/api/admin", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/deposit", require("./routes/depositRoutes"));
app.use("/api/redeem", require("./routes/redeemRoutes"));

app.use("/api/matches", require("./routes/match"));
app.use("/api/match", require("./routes/match"));

app.use("/api/battle", require("./routes/battleRoutes"));
app.use("/api/admin/battles", require("./routes/adminBattleRoutes"));
app.use("/api/match-proof", require("./routes/matchProofRoutes"));

app.use("/api/kyc", require("./routes/kyc"));


app.post(
  "/api/user/kyc",
  require("./middleware/auth"),
  require("./controllers/kycController").submitKyc
);

const otpStore = {};

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

    if (!process.env.FAST2SMS_API_KEY) {
      return res.status(500).json({
        success: false,
        msg: "FAST2SMS_API_KEY missing",
      });
    }

    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your OTP is ${otp}`,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
      }
    );

    return res.json({
      success: true,
      msg: "OTP sent successfully",
    });
  } catch (err) {
    console.log("❌ SMS ERROR:", err.response?.data || err.message);

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
      process.env.JWT_SECRET || "secret",
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