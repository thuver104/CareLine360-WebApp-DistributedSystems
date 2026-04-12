require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');

const ADMIN_EMAIL = 'admin@careline360.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

const seed = async () => {
  try {
    await connectDB();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const users = [
      {
        role: 'admin',
        status: 'ACTIVE',
        isActive: true,
        fullName: 'System Admin',
        email: ADMIN_EMAIL,
        phone: '94770000001',
        passwordHash,
      },
      {
        role: 'doctor',
        status: 'ACTIVE',
        isActive: true,
        fullName: 'Dr. Nimal Perera',
        email: 'doctor1@careline360.com',
        phone: '94770000002',
        passwordHash,
      },
      {
        role: 'patient',
        status: 'ACTIVE',
        isActive: true,
        fullName: 'Kasun Silva',
        email: 'patient1@careline360.com',
        phone: '94770000003',
        passwordHash,
      },
      {
        role: 'patient',
        status: 'ACTIVE',
        isActive: true,
        fullName: 'Anjali Fernando',
        email: 'patient2@careline360.com',
        phone: '94770000004',
        passwordHash,
      },
    ];

    const seededUsers = [];
    for (const user of users) {
      const doc = await User.findOneAndUpdate(
        { email: user.email },
        { $set: user },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
      seededUsers.push(doc);
    }

    const doctor = seededUsers.find((u) => u.role === 'doctor');
    const patientA = seededUsers.find((u) => u.email === 'patient1@careline360.com');
    const patientB = seededUsers.find((u) => u.email === 'patient2@careline360.com');

    const appointments = [
      {
        patient: patientA._id,
        doctor: doctor._id,
        status: 'pending',
        consultationType: 'general',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '10:00',
      },
      {
        patient: patientB._id,
        doctor: doctor._id,
        status: 'completed',
        consultationType: 'follow-up',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        time: '14:30',
      },
      {
        patient: patientA._id,
        doctor: doctor._id,
        status: 'confirmed',
        consultationType: 'telemedicine',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time: '09:15',
      },
    ];

    await Appointment.deleteMany({});
    await Appointment.insertMany(appointments);

    const [userCount, appointmentCount] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
    ]);

    console.log(`Seed complete: ${userCount} users, ${appointmentCount} appointments`);
    console.log(`Admin login email: ${ADMIN_EMAIL}`);
    console.log(`Admin login password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
