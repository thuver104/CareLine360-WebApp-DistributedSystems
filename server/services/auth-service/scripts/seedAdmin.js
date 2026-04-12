require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/careline_auth_db';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@careline360.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          role: 'admin',
          fullName: 'System Admin',
          email: ADMIN_EMAIL,
          phone: '94770000001',
          passwordHash,
          isVerified: true,
          isActive: true,
          status: 'ACTIVE',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    console.log('Auth admin seeded successfully');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('Auth admin seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
