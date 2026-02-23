require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const chatService = require("./services/chatService");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const documentRoutes = require("./routes/documentRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");

// Appointment-module routes
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(helmet());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hospitals", hospitalRoutes);

// Appointment-module routes
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Multer / Cloudinary specific errors
app.use((err, req, res, next) => {
  console.log("UPLOAD ERROR:", err);

  if (err?.message?.includes("Only image files allowed")) {
    return res.status(400).json({ message: "Only image files allowed" });
  }

  if (err?.message?.includes("Only PDF, images, DOC, DOCX allowed")) {
    return res
      .status(400)
      .json({ message: "Only PDF, images, DOC, DOCX allowed" });
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image too large (max 2MB)" });
  }

  return res.status(500).json({ message: err.message || "Server error" });
});

// Error Handler (must be after routes)
app.use(errorHandler);

const { startReminderScheduler } = require("./services/reminderScheduler");

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

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startReminderScheduler();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
