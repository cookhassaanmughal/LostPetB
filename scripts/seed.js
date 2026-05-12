const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Listing = require('../models/Listing');

dotenv.config();

const BASE_URL = 'http://localhost:5000/uploads/';

const NGO_DATA = [
  { name: 'Paws & Whiskers Sanctuary', email: 'ngo1@example.com', avatar: BASE_URL + 'ngo1.jpg', description: 'A safe haven for stray and abandoned animals in the city.' },
  { name: 'Feline Friends Foundation', email: 'ngo2@example.com', avatar: BASE_URL + 'ngo2.jpg', description: 'Dedicated to the rescue and rehabilitation of street cats.' },
  { name: 'Animal Care Trust', email: 'ngo3@example.com', avatar: BASE_URL + 'ngo3.jpg', description: 'Providing medical care and shelter for injured strays.' },
  { name: 'Rescue Rangers', email: 'ngo4@example.com', avatar: BASE_URL + 'ngo4.jpg', description: 'Fast-response rescue team for animals in distress.' },
  { name: 'The Pet Project', email: 'ngo5@example.com', avatar: BASE_URL + 'ngo5.jpg', description: 'Connecting loving families with animals in need of adoption.' },
];

const CAT_TITLES = [
  'Oliver the Brave', 'Bella the Explorer', 'Luna the Cuddler', 'Leo the Hunter', 'Milo the Sleeper',
  'Chloe the Singer', 'Simba the King', 'Lucy the Curious', 'Jack the Calm', 'Lily the Sweet'
];

const CAT_DESCRIPTIONS = [
  'A very friendly stray cat found near the market. Loves scratches.',
  'Lost cat with a beautiful tabby pattern. Last seen on 5th Street.',
  'Looking for a forever home. This kitten is very playful and house-trained.',
  'Found wandering in the rain. Very vocal and hungry.',
  'Lost family pet. Very shy, please do not chase.',
  'High-energy stray kitten looking for a buddy.',
  'Calm and independent cat found near the park.',
  'Sweet senior cat looking for a quiet retirement home.',
  'Energetic hunter, great for a house with a garden.',
  'Beautiful long-haired cat found near the library.'
];

const CAT_LOCATIONS = [
  'Central Park Heights', 'Downtown Avenue', 'Brooklyn Bridge Area', 'Queens Boulevard', 'Jersey Side Woods',
  'Greenwich Village', 'Astoria Park', 'Williamsburg Waterfront', 'Harlem North', 'Chelsea Market Vicinity'
];

const seed = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/lost-pet';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Listing.deleteMany({});
    console.log('Cleared existing data.');

    const password = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create Admin
    await User.create({
      name: 'Ibrahim (Admin)',
      email: 'admin@example.com',
      password: adminPassword,
      isAdmin: true,
      isVerifiedNGO: true,
      isVerified: true
    });
    console.log('Created Admin account (admin@example.com / admin123)');

    // Create NGOs
    const ngos = await Promise.all(
      NGO_DATA.map(ngo => User.create({ ...ngo, password, isNGO: true, isVerifiedNGO: true, isVerified: true }))
    );
    console.log(`Created ${ngos.length} NGO accounts.`);

    // Create 10 Cat Listings (one for each image)
    const listings = [];
    for (let i = 1; i <= 10; i++) {
      const category = i % 3 === 0 ? 'Lost' : i % 3 === 1 ? 'Found' : 'Adoption';
      listings.push({
        category,
        title: CAT_TITLES[i-1],
        species: 'Cat',
        breed: 'Domestic Shorthair',
        color: i % 2 === 0 ? 'Tabby' : 'Ginger',
        location: CAT_LOCATIONS[i-1],
        description: CAT_DESCRIPTIONS[i-1],
        images: [BASE_URL + `cat${i}.jpg`],
        owner: ngos[i % 5]._id,
        status: 'Active',
        contactInfo: 'Contact via NGO profile'
      });
    }

    // Add 5 more listings (using some of the images again but with different titles) to reach 15
    for (let i = 1; i <= 5; i++) {
       listings.push({
        category: 'Adoption',
        title: `Available for Adoption: ${CAT_TITLES[i-1]} Jr.`,
        species: 'Cat',
        breed: 'Mixed',
        color: 'Mixed',
        location: 'Community Shelter',
        description: 'A rescue from a local colony. Ready for a new life.',
        images: [BASE_URL + `cat${i}.jpg`], // Re-using images for more listings
        owner: ngos[i-1]._id,
        status: 'Active',
        contactInfo: 'Call 555-0100'
      });
    }

    await Listing.insertMany(listings);
    console.log(`Created ${listings.length} animal listings.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
