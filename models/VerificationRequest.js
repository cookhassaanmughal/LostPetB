const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationName: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    contactEmail: { type: String, required: true },
    website: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
