const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

const users = [
  { name: "Alice Johnson", email: "alice@careline.com", role: "patient", phone: "+1-555-0101" },
  { name: "Bob Smith", email: "bob@careline.com", role: "patient", phone: "+1-555-0102" },
  { name: "Carol Davis", email: "carol@careline.com", role: "patient", phone: "+1-555-0103" },
  { name: "Dr. Sarah Chen", email: "sarah@careline.com", role: "doctor", phone: "+1-555-0201", specialization: "General Medicine" },
  { name: "Dr. James Wilson", email: "james@careline.com", role: "doctor", phone: "+1-555-0202", specialization: "Cardiology" },
  { name: "Dr. Priya Patel", email: "priya@careline.com", role: "doctor", phone: "+1-555-0203", specialization: "Pediatrics" },
  { name: "Admin User", email: "admin@careline.com", role: "admin", phone: "+1-555-0301" },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    console.log("Cleared existing users");

    const created = await User.insertMany(users);
    console.log(`Seeded ${created.length} users:`);
    created.forEach((u) => console.log(`  - ${u.name} (${u.role}) [${u._id}]`));

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedUsers();
