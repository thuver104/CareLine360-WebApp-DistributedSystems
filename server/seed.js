const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const EmergencyCase = require('./src/models/EmergencyCase');

dotenv.config();

const users = [
    {
        name: "John Doe",
        email: "john@example.com",
        role: "patient",
        phone: "0771234567",
        status: "active"
    },
    {
        name: "Jane Smith",
        email: "jane@example.com",
        role: "patient",
        phone: "0777654321",
        status: "active"
    },
    {
        name: "Dr. Saman Kumara",
        email: "saman@example.com",
        role: "doctor",
        phone: "0711112222",
        status: "active"
    },
    {
        name: "Responder Ruwan",
        email: "ruwan@example.com",
        role: "responder",
        phone: "0755556666",
        status: "active"
    },
    {
        name: "Admin User",
        email: "admin@careline360.com",
        role: "admin",
        phone: "0700000000",
        status: "active"
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        await User.deleteMany();
        await EmergencyCase.deleteMany();

        const createdUsers = await User.insertMany(users);
        console.log('Users Seeded!');

        // Add some initial emergency cases
        const patient1 = createdUsers.find(u => u.name === "John Doe");
        const patient2 = createdUsers.find(u => u.name === "Jane Smith");

        const emergencies = [
            {
                patient: patient1._id,
                description: "Severe chest pain and difficulty breathing",
                status: "PENDING",
                latitude: 6.9271,
                longitude: 79.8612,
                triggeredAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            },
            {
                patient: patient2._id,
                description: "Accident victim, multiple fractures",
                status: "RESOLVED",
                latitude: 6.9123,
                longitude: 79.8780,
                responderName: "Ruwan",
                triggeredAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
                resolvedAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
                responseTime: 30
            }
        ];

        await EmergencyCase.insertMany(emergencies);
        console.log('Emergency Cases Seeded!');

        console.log('Data Seeding Completed!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
