const mongoose = require('mongoose');
const Listing = require('../models/Listing');
require('dotenv').config({ path: `${__dirname}/../.env` });

const runMaintenance = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lost-pet';

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB for maintenance.');

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await Listing.updateMany(
    {
      archived: false,
      status: { $in: ['Resolved', 'Adopted'] },
      updatedAt: { $lt: cutoff },
    },
    { archived: true }
  );

  console.log(`Database maintenance complete. Archived ${result.modifiedCount} listings.`);
  await mongoose.disconnect();
};

runMaintenance().catch((error) => {
  console.error('Maintenance failed:', error);
  process.exit(1);
});
