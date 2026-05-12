const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/donations
// @desc    Submit a donation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ngoId, amount, message, saveCard, cardDetails } = req.body;
    
    // Create the donation
    const donation = await Donation.create({
      donor: req.user.id,
      ngo: ngoId,
      amount,
      message,
      status: 'Completed'
    });

    // If user wants to save card, update User model
    if (saveCard && cardDetails) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, {
        savedCard: {
          number: cardDetails.number,
          expiry: cardDetails.expiry
        }
      });
    }

    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/donations/my
// @desc    Get current user's donations
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id }).populate('ngo', 'name avatar');
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
