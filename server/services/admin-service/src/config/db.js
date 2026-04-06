const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/careline_admin_db";
  await mongoose.connect(uri);
  // Keep logs concise for container environments.
  console.log(`[admin-service] MongoDB connected: ${mongoose.connection.name}`);
};

module.exports = connectDB;
