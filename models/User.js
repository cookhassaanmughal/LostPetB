const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isNGO: { type: Boolean, default: false },
    isVerifiedNGO: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    description: { type: String, trim: true },
    avatar: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    savedCard: {
      number: String,
      expiry: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
