import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoute.js";
import { Server } from "socket.io";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Configure CORS explicitly
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Initialize Socket.io with matching CORS
export const io = new Server(server, {
  cors: corsOptions,
});

// Store online users
export const userSocketMap = {};

// ✅ Socket.io connection handler (safe version)
io.on("connection", (socket) => {
  const userId = socket.handshake?.query?.userId; // Safe optional chaining

  if (userId) {
    console.log("✅ User Connected:", userId);
    userSocketMap[userId] = socket.id;
  } else {
    console.warn("⚠️ Socket connected without userId");
  }

  // Send the list of online users to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle user disconnect
  socket.on("disconnect", () => {
    if (userId) {
      console.log(" User Disconnected:", userId);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// ✅ Middleware
app.use(express.json({ limit: "4mb" }));

// ✅ Health route
app.get("/api/status", (req, res) => res.send("Server is live"));

// ✅ API routes
app.use("/api/users", userRouter);     // Changed from /api/auth → /api/users
app.use("/api/messages", messageRouter);

// ✅ Connect to MongoDB and start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(` Server running on PORT: ${PORT}`)
    );
  })
  .catch((err) => {
    console.error(" MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ✅ Export for Vercel or other deployments
export default server;

