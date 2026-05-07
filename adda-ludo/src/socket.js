
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: false
});

socket.on("connect", () => {
  console.log("✅ Socket Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.log("🚨 Socket Connection Error:", err.message);
});