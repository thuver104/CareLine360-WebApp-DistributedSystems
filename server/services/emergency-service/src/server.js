require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "emergency-service", timestamp: new Date().toISOString() });
});

app.use("/api/v1/emergency", emergencyRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/v1/hospitals", hospitalRoutes);
app.use("/api/hospitals", hospitalRoutes);

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[emergency-service] running on port ${PORT}`);
      console.log(`[emergency-service] health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("[emergency-service] startup failed:", err.message);
    process.exit(1);
  }
};

start();
