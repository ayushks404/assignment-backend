import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Error: ADMIN_EMAIL or ADMIN_PASSWORD not defined in env variables.');
    process.exit(1);
  }

  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists. Skipping seed.`);
    } else {
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user successfully seeded!');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedAdmin();
