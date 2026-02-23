require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const documentRoutes = require("./routes/documentRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(helmet());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/documents", documentRoutes);

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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});