require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const chatService = require("./services/chatService");

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const documentRoutes = require("./routes/documentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const chatRoutes = require("./routes/chatRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Socket handler
const { registerSocketHandlers } = require("./socket/chatSocket");

// Schedulers
const { startMeetingScheduler } = require("./services/meetingScheduler");
const { startReminderScheduler } = require("./services/reminderScheduler");

// Connect to MongoDB, then start schedulers
connectDB()
  .then(() => {
    startMeetingScheduler();
    startReminderScheduler();
  })
  .catch(console.error);

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
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
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => res.send("CareLine360 API ✅"));

// ── Multer / Cloudinary / File Upload Error Handler ────────────────────────────
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

// ── Global Error Handler (from middleware) ─────────────────────────────────────
app.use(errorHandler);

// ── HTTP + Socket.io Server ────────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register structured socket event handlers (doctor-module)
registerSocketHandlers(io);

// Inline socket handlers (dev)
io.on("connection", (socket) => {
  socket.on("joinRoom", (appointmentId) => {
    socket.join(appointmentId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const message = await chatService.sendMessage(data);
      io.to(data.appointment).emit("newMessage", message);
    } catch (err) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });
});

// Make io accessible in routes/controllers if needed
app.set("io", io);

// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 1111;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server + Socket.io running on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  httpServer.close(() => process.exit(1));
});