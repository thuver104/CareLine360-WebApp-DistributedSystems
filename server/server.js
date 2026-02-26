require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const documentRoutes = require("./routes/documentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Socket handler
const { registerSocketHandlers } = require("./socket/chatSocket");

// Meeting reminder scheduler
const { startMeetingScheduler } = require("./services/meetingScheduler");

// Connect to MongoDB, then start the meeting reminder scheduler
connectDB()
  .then(() => {
    startMeetingScheduler();
  })
  .catch(console.error);

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "20mb" })); // increased for base64 images
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(helmet());

// ── HTTP Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => res.send("CareLine360 API ✅"));

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("APP ERROR:", err);
  if (err?.message?.includes("Only image files allowed"))
    return res.status(400).json({ message: "Only image files allowed" });
  if (err?.message?.includes("Only PDF, images, DOC, DOCX allowed"))
    return res
      .status(400)
      .json({ message: "Only PDF, images, DOC, DOCX allowed" });
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message: "File too large" });
  return res
    .status(500)
    .json({ message: err.message || "Internal server error" });
});

// ── HTTP + Socket.io Server ────────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register socket event handlers
registerSocketHandlers(io);

// Make io accessible in routes/controllers if needed
app.set("io", io);

const PORT = process.env.PORT || 1111;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server + Socket.io running on port ${PORT}`),
);
