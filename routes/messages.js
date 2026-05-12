const express = require('express');
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/auth');
const { validate, messageSchema } = require('../middleware/validate');
const Listing = require('../models/Listing');
const axios = require('axios');

const router = express.Router();

// Get inbox (messages where user is receiver or sender)
router.get('/inbox', authMiddleware, async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ receiver: req.user.id }, { sender: req.user.id }]
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('listing', 'title images')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Send a message
router.post('/', authMiddleware, validate(messageSchema), async (req, res, next) => {
  try {
    const { receiver, listing, content, recaptchaToken } = req.body;
    
    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'placeholder') {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
      );
      if (!response.data.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed.' });
      }
    }

    // Verify listing exists
    const existingListing = await Listing.findById(listing);
    if (!existingListing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver,
      listing,
      content
    });
    
    await message.populate('sender', 'name email');
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    
    // Only receiver can mark as read
    if (String(message.receiver) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    message.read = true;
    await message.save();
    res.json(message);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
