require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "admin-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/admin", adminRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[admin-service] running on port ${PORT}`);
      console.log(`[admin-service] health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("[admin-service] startup failed:", err.message);
    process.exit(1);
  }
};

start();
