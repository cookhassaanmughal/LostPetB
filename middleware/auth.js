const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
