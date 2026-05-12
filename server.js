const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const uploadRoutes = require('./routes/upload');
const messageRoutes = require('./routes/messages');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/verification', require('./routes/verification'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/donations', require('./routes/donations'));

app.get('/', (req, res) => {
  res.send({ message: 'Lost & Found Pet Adoption Platform API' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
