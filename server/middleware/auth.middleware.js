import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const secret = process.env.JWT_SECRET || 'gamelearn_secret_key_mvp_2026';

  if (!token) {
    // Guest or demo request fallback: set req.user to demo user ID
    req.user = { id: '000000000000000000000000', name: 'Demo Learner', isGuest: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};
