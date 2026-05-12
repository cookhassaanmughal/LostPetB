const express = require('express');
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Submit a verification request
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const existing = await VerificationRequest.findOne({ user: req.user.id, status: 'Pending' });
    if (existing) return res.status(400).json({ message: 'You already have a pending verification request.' });

    const request = await VerificationRequest.create({
      ...req.body,
      user: req.user.id,
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// Get current user's request status
router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const request = await VerificationRequest.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Admin: Get all requests (in a real app, this would be restricted to admins)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const requests = await VerificationRequest.find().populate('user', 'name email');
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// Admin: Update request status
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    request.status = status;
    request.adminNotes = adminNotes;
    await request.save();

    if (status === 'Approved') {
      await User.findByIdAndUpdate(request.user, { isNGO: true });
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
