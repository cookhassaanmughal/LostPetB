const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lost-pet';
    await mongoose.connect(uri);
    console.log('MongoDB connected for seeding');

    const adminEmail = 'admin@gmail.com';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log('Admin already exists. Updating password...');
      existing.isAdmin = true;
      existing.isVerified = true;
      await existing.save();
    } else {
      console.log('Creating new admin...');
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: await bcrypt.hash('admin123', 10),
        isAdmin: true,
        isVerified: true
      });
    }

    console.log('Admin seeded successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();
