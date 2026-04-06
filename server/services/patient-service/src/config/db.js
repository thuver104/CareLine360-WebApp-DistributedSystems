/**
 * MongoDB Connection Configuration
 * Database: careline_patient_db (isolated per service)
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careline_patient_db';

const connectDB = async () => {
  try {
    // Mongoose 7+ doesn't need these options but they're harmless
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Retry logic
    console.log('Retrying connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB();
  }
};

module.exports = { connectDB };
