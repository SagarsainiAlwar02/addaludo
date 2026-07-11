import mongoose from "mongoose";

const MAX_BATTLES = 100;

const battleSchema = new mongoose.Schema(
  {
    battleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: { type: Number, required: true, min: 50 },
    prize: {
      type: Number,
      required: true,
      min: 0,
    },

   createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: function () { return !this.isDummy; },
  default: null,
  index: true,
},

    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    ludoKingRoomCode: {
      type: String,
      default: "",
      validate: {
        validator(v) {
          return v === "" || /^\d{8}$/.test(v);
        },
        message: "Room code must be 8 digits",
      },
    },

    roomCodeSetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    screenshot: { type: String, default: "" },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resultSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resultType: {
      type: String,
      enum: ["", "win", "loss", "cancel"],
      default: "",
    },
    results: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          result: {
            type: String,
            enum: ["win", "loss", "cancel"],
            required: true,
          },
          screenshot: {
            type: String,
            default: "",
          },
          submittedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      validate: {
        validator(arr) {
          const ids = arr.map((x) => String(x.user));
          return ids.length === new Set(ids).size;
        },
        message: "Duplicate result submission not allowed",
      },
    },

    cancelVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    timerStartedAt: {
      type: Date,
      default: null,
    },

    entryLocked: {
      type: Boolean,
      default: false,
    },

    resultSettled: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "open",
        "join_requested",
        "running",
        "room_submitted",
        "result_submitted",
        "loss_submitted",
        "cancel_requested",
        "approved",
        "rejected",
        "cancelled",
      ],
      default: "open",
      index: true,
    },

    adminNote: { type: String, default: "" },
      // ✅ Dummy battle fields — social-proof ke liye, real user nahi hai
    isDummy: { type: Boolean, default: false, index: true },
    dummyName: { type: String, default: "" },
    dummyMobile: { type: String, default: "" },
  },
  { timestamps: true }
);

battleSchema.index({ createdAt: -1 });
battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ createdBy: 1, status: 1 });
battleSchema.index({ opponent: 1, status: 1 });

battleSchema.index({ battleId: 1, status: 1 });

// ✅ Auto-cleanup setup
// Sirf FINISHED/terminal status wale matches hi auto-delete honge.
// Active matches (open, running, pending, join_requested, etc.) kabhi delete nahi honge,
// chahe total count 100 se zyada hi kyu na ho jaye — taki koi live match beech me gayab na ho.
const TERMINAL_STATUSES = ["approved", "completed", "cancelled", "rejected"];

// Track karo ki document naya bana hai ya sirf update ho raha hai
battleSchema.pre("save", function (next) {
  this.$locals.wasNew = this.isNew;
  next();
});

// Naya battle create hone ke baad hi cleanup check chalega (performance ke liye)
battleSchema.post("save", async function (doc) {
  if (!doc.$locals.wasNew) return;

  try {
    const Battle = doc.constructor;
    const totalCount = await Battle.countDocuments();

    if (totalCount > MAX_BATTLES) {
      const excess = totalCount - MAX_BATTLES;

      // Sabse purane TERMINAL status wale matches dhundo (active wale skip)
      const oldestTerminalBattles = await Battle.find({
        status: { $in: TERMINAL_STATUSES },
      })
        .sort({ createdAt: 1 }) // sabse purana pehle
        .limit(excess)
        .select("_id");

      if (oldestTerminalBattles.length > 0) {
        const idsToDelete = oldestTerminalBattles.map((b) => b._id);
        await Battle.deleteMany({ _id: { $in: idsToDelete } });
        console.log(
          `[Battle auto-cleanup] ${idsToDelete.length} purane finished match(es) delete kiye. Total ab: ${totalCount - idsToDelete.length}`
        );
      }
      // Agar terminal status wale kam hain to active matches ko chhoda jayega,
      // count 100 se thoda upar reh sakta hai jab tak wo matches finish na ho jayen.
    }
  } catch (err) {
    console.error("[Battle auto-cleanup] Failed:", err);
  }
});

export default mongoose.models.Battle || mongoose.model("Battle", battleSchema);