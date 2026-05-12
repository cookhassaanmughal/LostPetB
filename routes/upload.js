const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for both memory (Cloudinary) and disk (Fallback)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadLocal = multer({ storage });

router.post('/', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required.' });

    // Check if Cloudinary is configured
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder';

    if (isCloudinaryConfigured) {
      const streamUpload = (reqFile) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'lost-pet-images', quality: 'auto' }, (error, result) => {
            if (result) resolve(result);
            else reject(error);
          });
          streamifier.createReadStream(reqFile.buffer).pipe(stream);
        });
      };

      try {
        const result = await streamUpload(req.file);
        return res.json({ url: result.secure_url });
      } catch (uploadError) {
        console.error('Cloudinary upload failed, falling back to local storage:', uploadError);
      }
    }

    // Fallback: Save locally
    const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Return the local URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ url: `${baseUrl}/uploads/${filename}` });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
