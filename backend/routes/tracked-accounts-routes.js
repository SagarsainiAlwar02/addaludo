// ================= CLIENT ACCOUNT TRACKING =================
// Paste this whole block anywhere in admin.js (e.g. after the DUMMY BATTLES section).
// Also add near the top imports: import TrackedAccount from "../models/trackedAccount.js";

router.post("/tracked-accounts/add", auth, async (req, res) => {
  try {
    const phone = cleanPhone(req.body.phone);
    const note = String(req.body.note || "").trim();

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ msg: "Valid 10 digit mobile number required" });
    }

    const exists = await TrackedAccount.findOne({ phone });
    if (exists) return res.status(400).json({ msg: "Ye number already track ho raha hai" });

    const account = await TrackedAccount.create({ phone, note });
    res.json({ success: true, msg: "Number add ho gaya", account });
  } catch (err) {
    console.log("❌ ADD TRACKED ACCOUNT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.get("/tracked-accounts/all", auth, async (req, res) => {
  try {
    const accounts = await TrackedAccount.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/tracked-accounts/:id", auth, async (req, res) => {
  try {
    await TrackedAccount.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Number remove ho gaya" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Report: har tracked number ka match/win/loss/net data — real Battle data se
router.get("/tracked-accounts/report", auth, async (req, res) => {
  try {
    const tracked = await TrackedAccount.find().lean();
    const phones = tracked.map((t) => t.phone);

    if (phones.length === 0) {
      return res.json({ success: true, accounts: [], summary: null, trackedList: [] });
    }

    const users = await User.find({ phone: { $in: phones } }).select("_id phone name").lean();
    const userIds = users.map((u) => String(u._id));

    const userMap = {};
    users.forEach((u) => { userMap[String(u._id)] = u; });

    const battles = await Battle.find({
      $or: [{ createdBy: { $in: userIds } }, { opponent: { $in: userIds } }],
      status: { $in: ["approved", "cancelled"] },
    })
      .select("battleId amount prize status winner createdBy opponent createdAt")
      .lean();

    const perAccount = {};
    userIds.forEach((id) => {
      perAccount[id] = {
        userId: id,
        phone: userMap[id]?.phone || "",
        name: userMap[id]?.name || "",
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        totalEntry: 0,
        totalWinnings: 0,
        net: 0,
      };
    });

    for (const b of battles) {
      if (b.status === "cancelled") continue; // refunded — koi profit/loss impact nahi

      const creatorId = String(b.createdBy || "");
      const opponentId = String(b.opponent || "");
      const winnerId = b.winner ? String(b.winner) : null;
      const amount = Number(b.amount || 0);
      const prize = Number(b.prize || 0);

      for (const pid of [creatorId, opponentId]) {
        if (!perAccount[pid]) continue;
        perAccount[pid].matchesPlayed += 1;
        perAccount[pid].totalEntry += amount;
        if (winnerId === pid) {
          perAccount[pid].wins += 1;
          perAccount[pid].totalWinnings += prize;
        } else if (winnerId) {
          perAccount[pid].losses += 1;
        }
      }
    }

    const list = Object.values(perAccount).map((a) => ({
      ...a,
      net: a.totalWinnings - a.totalEntry,
    }));

    const summary = {
      matchesPlayed: battles.filter((b) => b.status !== "cancelled").length,
      wins: list.reduce((s, a) => s + a.wins, 0),
      losses: list.reduce((s, a) => s + a.losses, 0),
      totalEntry: list.reduce((s, a) => s + a.totalEntry, 0),
      totalWinnings: list.reduce((s, a) => s + a.totalWinnings, 0),
      net: list.reduce((s, a) => s + a.net, 0),
    };

    res.json({ success: true, accounts: list, summary, trackedList: tracked });
  } catch (err) {
    console.log("❌ TRACKED ACCOUNTS REPORT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});