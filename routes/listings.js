const express = require('express');
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/auth');
const { validate, listingSchema } = require('../middleware/validate');
const axios = require('axios');

const router = express.Router();

const buildFilters = (query) => {
  const filters = { status: 'Active', archived: false };
  if (query.category) filters.category = query.category;
  
  // Use text search if there is a general search term, otherwise fall back to specific fields
  if (query.search) {
    filters.$text = { $search: query.search };
  } else {
    if (query.species) filters.species = new RegExp(query.species, 'i');
    if (query.breed) filters.breed = new RegExp(query.breed, 'i');
    if (query.color) filters.color = new RegExp(query.color, 'i');
    if (query.size) filters.size = query.size;
    if (query.location) filters.location = new RegExp(query.location, 'i');
  }
  return filters;
};

router.get('/', async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const listings = await Listing.find(filters).populate('owner', 'name email isNGO description').sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', 'name email isNGO description');
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/matches', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    const targetCategory = listing.category === 'Lost' ? 'Found' : listing.category === 'Found' ? 'Lost' : null;
    if (!targetCategory) return res.json({ matches: [] });

    // Weighted matching aggregation
    const pipeline = [
      {
        $match: {
          category: targetCategory,
          status: 'Active',
          archived: false,
          _id: { $ne: listing._id }
        }
      },
      {
        $addFields: {
          matchScore: {
            $sum: [
              { $cond: [{ $eq: [{ $toLower: "$species" }, { $toLower: listing.species }] }, 40, 0] },
              { $cond: [{ $and: [{ $ne: ["$breed", ""] }, { $eq: [{ $toLower: "$breed" }, { $toLower: listing.breed || "" }] }] }, 30, 0] },
              { $cond: [{ $and: [{ $ne: ["$color", ""] }, { $eq: [{ $toLower: "$color" }, { $toLower: listing.color || "" }] }] }, 20, 0] },
              { $cond: [{ $regexMatch: { input: "$location", regex: new RegExp(listing.location || "", 'i') } }, 10, 0] }
            ]
          }
        }
      },
      { $match: { matchScore: { $gt: 0 } } },
      { $sort: { matchScore: -1 } },
      { $limit: 10 }
    ];

    const aggregatedMatches = await Listing.aggregate(pipeline);
    
    // Add match reason
    const matchesWithReason = aggregatedMatches.map(m => {
      let reasons = [];
      if (m.species && listing.species && m.species.toLowerCase() === listing.species.toLowerCase()) reasons.push('species');
      if (m.breed && listing.breed && m.breed.toLowerCase() === listing.breed.toLowerCase()) reasons.push('breed');
      if (m.color && listing.color && m.color.toLowerCase() === listing.color.toLowerCase()) reasons.push('color');
      if (m.location && listing.location && new RegExp(listing.location, 'i').test(m.location)) reasons.push('location proximity');
      
      return {
        ...m,
        matchReason: `Matched because of ${reasons.join(' + ')}`
      };
    });

    res.json({ matches: matchesWithReason });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, validate(listingSchema), async (req, res, next) => {
  try {
    const { recaptchaToken, ...body } = req.body;

    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'placeholder') {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
      );
      if (!response.data.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed.' });
      }
    }

    const listing = await Listing.create({ ...body, owner: req.user.id });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, validate(listingSchema), async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (String(listing.owner) !== req.user.id) return res.status(403).json({ message: 'Unauthorized.' });

    const { recaptchaToken, ...body } = req.body;

    // Verify reCAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'placeholder') {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
      );
      if (!response.data.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed.' });
      }
    }

    Object.assign(listing, body);
    await listing.save();
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (String(listing.owner) !== req.user.id) return res.status(403).json({ message: 'Unauthorized.' });

    await listing.remove();
    res.json({ message: 'Listing deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
