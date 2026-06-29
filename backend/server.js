import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { initSocket } from "./socket/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5000";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../frontend");

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", messageRoutes);

app.use(express.static(frontendPath));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

initSocket(io);

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
