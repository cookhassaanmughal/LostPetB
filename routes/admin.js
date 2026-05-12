const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing');
const Donation = require('../models/Donation');
const { authMiddleware } = require('../middleware/auth');

// Admin middleware
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error during admin check.' });
  }
};

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const totalNGOs = await User.countDocuments({ isNGO: true });
    const verifiedNGOs = await User.countDocuments({ isVerifiedNGO: true });
    const pendingNGOs = await User.countDocuments({ isNGO: true, isVerifiedNGO: false });
    const flaggedListings = await Listing.countDocuments({ isFlagged: true });
    
    const donations = await Donation.find();
    const totalDonationAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonationsCount = donations.length;
    
    // Get recent activity (last 5 listings)
    const recentListings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'name');

    res.json({
      totalUsers,
      totalListings,
      totalNGOs,
      verifiedNGOs,
      pendingNGOs,
      flaggedListings,
      totalDonationAmount,
      totalDonationsCount,
      recentListings
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/admin/users/:id/verify-ngo
// @desc    Toggle NGO verification status
router.patch('/users/:id/verify-ngo', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isVerifiedNGO = !user.isVerifiedNGO;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and their listings
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Delete all listings by this user
    await Listing.deleteMany({ owner: user._id });
    await User.findByIdAndDelete(user._id);
    
    res.json({ message: 'User and associated listings deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/admin/listings
// @desc    Get all listings
router.get('/listings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const listings = await Listing.find().populate('owner', 'name email isNGO isVerifiedNGO').sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/admin/listings/:id/flag
// @desc    Toggle listing flag status
router.patch('/listings/:id/flag', authMiddleware, adminOnly, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    listing.isFlagged = !listing.isFlagged;
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/admin/listings/:id
// @desc    Delete a listing
router.delete('/listings/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/admin/donations
// @desc    Get all donations
router.get('/donations', authMiddleware, adminOnly, async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name email')
      .populate('ngo', 'name')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
