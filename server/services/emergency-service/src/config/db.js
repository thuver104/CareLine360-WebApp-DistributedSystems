const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/careline_emergency_db";
  const conn = await mongoose.connect(uri);
  console.log(`[emergency-service] MongoDB connected: ${conn.connection.name}`);
};

module.exports = connectDB;
