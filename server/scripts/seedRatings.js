const mongoose = require("mongoose");
const Rating = require("../models/Rating");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Connect to the database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Removed deprecated options
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

// Seed data
const seedRatings = async () => {
  try {
    // Sample data
    const ratings = [
      {
        doctorId: "63f1a2b4c8e4a2d9f8a1b2c3", // Replace with actual Doctor ID
        patientId: "63f1a2b4c8e4a2d9f8a1b2c4", // Replace with actual Patient ID
        appointmentId: "63f1a2b4c8e4a2d9f8a1b2c5", // Replace with actual Appointment ID
        rating: 5,
        review: "Excellent service! Highly recommended.",
      },
      {
        doctorId: "63f1a2b4c8e4a2d9f8a1b2c3", // Replace with actual Doctor ID
        patientId: "63f1a2b4c8e4a2d9f8a1b2c6", // Replace with actual Patient ID
        appointmentId: "63f1a2b4c8e4a2d9f8a1b2c7", // Replace with actual Appointment ID
        rating: 4,
        review: "Good consultation, but the waiting time was long.",
      },
      {
        doctorId: "63f1a2b4c8e4a2d9f8a1b2c8", // Replace with actual Doctor ID
        patientId: "63f1a2b4c8e4a2d9f8a1b2c9", // Replace with actual Patient ID
        appointmentId: "63f1a2b4c8e4a2d9f8a1b2d0", // Replace with actual Appointment ID
        rating: 3,
        review: "Average experience. Could be better.",
      },
    ];

    // Clear existing data
    await Rating.deleteMany();
    console.log("Existing ratings cleared");

    // Insert new data
    await Rating.insertMany(ratings);
    console.log("Ratings seeded successfully");
    process.exit();
  } catch (error) {
    console.error("Error seeding ratings:", error.message);
    process.exit(1);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await seedRatings();
};

run();