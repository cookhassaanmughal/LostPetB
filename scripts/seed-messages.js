const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Message = require('../models/Message');
const dotenv = require('dotenv');

dotenv.config();

const seedMessages = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/lost-pet';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for message seeding...');

    const users = await User.find({ isNGO: false });
    const ngos = await User.find({ isNGO: true });
    const listings = await Listing.find();

    if (ngos.length === 0 || listings.length === 0) {
      console.log('Not enough data to seed messages. Run npm run seed first.');
      process.exit(1);
    }

    // If no regular users, create a test user
    let sender;
    if (users.length === 0) {
      const bcrypt = require('bcryptjs');
      const password = await bcrypt.hash('password123', 10);
      sender = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password
      });
      console.log('Created test user Jane Doe.');
    } else {
      sender = users[0];
    }

    const messages = [
      {
        sender: sender._id,
        receiver: ngos[0]._id,
        listing: listings[0]._id,
        content: 'Hi! I saw Oliver the Brave and I would love to adopt him. Is he still available?',
        read: false
      },
      {
        sender: sender._id,
        receiver: ngos[1]._id,
        listing: listings[1]._id,
        content: 'I think I saw Bella the Explorer near the train station yesterday. Hope this helps!',
        read: false
      },
      {
        sender: ngos[0]._id,
        receiver: sender._id,
        listing: listings[0]._id,
        content: 'Hello Jane! Yes, Oliver is still available. Would you like to schedule a visit?',
        read: true
      },
      {
        sender: sender._id,
        receiver: ngos[2]._id,
        listing: listings[2]._id,
        content: 'Is Luna good with other pets? I have a small dog at home.',
        read: false
      }
    ];

    await Message.insertMany(messages);
    console.log(`Created ${messages.length} dummy messages.`);

    console.log('Message seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Message seeding error:', err);
    process.exit(1);
  }
};

seedMessages();
