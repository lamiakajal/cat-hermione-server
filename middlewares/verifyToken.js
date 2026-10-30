const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Extract token from cookies or authorization header
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send({
      success: false,
      message: 'Unauthorized access. No token provided.',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden access. Invalid or expired token.',
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
