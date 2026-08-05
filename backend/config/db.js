import mongoose from "mongoose";

/**
 * Connect to MongoDB using Mongoose.
 * Reads connection string from MONGO_URI env variable.
 * Uses dbName "ludoDB" by default.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(mongoUri
      // , {
      // dbName: "ludoDB",
      // }
    );

    console.log(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
