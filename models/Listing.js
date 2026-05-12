const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['Lost', 'Found', 'Adoption'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    species: { type: String, required: true, trim: true },
    breed: { type: String, trim: true },
    age: { type: String, trim: true },
    color: { type: String, trim: true },
    size: { type: String, enum: ['Small', 'Medium', 'Large', 'Unknown'], default: 'Unknown' },
    description: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    contactInfo: { type: String, trim: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Adopted'],
      default: 'Active',
    },
    archived: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    matchedIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  },
  { timestamps: true }
);

listingSchema.index({
  title: 'text',
  species: 'text',
  breed: 'text',
  color: 'text',
  location: 'text',
  description: 'text'
}, {
  weights: {
    species: 10,
    title: 5,
    breed: 5,
    color: 3,
    location: 3,
    description: 1
  },
  name: "ListingTextIndex"
});

module.exports = mongoose.model('Listing', listingSchema);
