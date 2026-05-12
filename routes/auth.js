const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validate, registerSchema, loginSchema, profileSchema } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');
const crypto = require('crypto');

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({ 
      name, 
      email, 
      password: hashed,
      verificationToken 
    });

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // We still created the user, but they'll need to resend verification later if needed
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email: identifier, password } = req.body;

    const user = await User.findOne({ 
      $or: [{ email: identifier }, { name: identifier }] 
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email address before logging in.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, isNGO: user.isNGO, isAdmin: user.isAdmin, isVerifiedNGO: user.isVerifiedNGO, avatar: user.avatar, description: user.description },
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token is required.' });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token.' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authMiddleware, validate(profileSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    Object.assign(user, req.body);
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isVerifiedNGO: user.isVerifiedNGO,
      avatar: user.avatar,
      description: user.description,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    next(error);
  }
});

router.post('/favorites/:id', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const listingId = req.params.id;
    
    const index = user.favorites.indexOf(listingId);
    if (index === -1) {
      user.favorites.push(listingId);
    } else {
      user.favorites.splice(index, 1);
    }
    
    await user.save();
    res.json(user.favorites);
  } catch (error) {
    next(error);
  }
});

router.get('/favorites', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      populate: { path: 'owner', select: 'name email isNGO isVerifiedNGO' }
    });
    res.json(user.favorites);
  } catch (error) {
    next(error);
  }
});

router.post('/verify-password', authMiddleware, async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Incorrect password.' });

    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
