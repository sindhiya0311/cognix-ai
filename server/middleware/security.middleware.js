/**
 * Simple in-memory rate limiter middleware.
 * Tracks requests per user per window and returns 429 when limit is exceeded.
 * 
 * For production at scale, replace with Redis-backed rate limiting.
 */
const rateLimitStore = new Map();

export function rateLimit({ windowMs = 60000, maxRequests = 20, message = 'Too many requests, please try again later' } = {}) {
  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now - entry.windowStart > windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs * 2);

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const key = `${userId}:${req.originalUrl}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 0 };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterMs: windowMs - (now - entry.windowStart)
      });
    }

    next();
  };
}

/**
 * Input validation middleware for the NOVA endpoint.
 * Ensures the query string is present and within length limits.
 */
export function validateNovaInput(req, res, next) {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, message: 'Query string is required' });
  }

  if (query.length > 1000) {
    return res.status(400).json({ success: false, message: 'Query must be under 1000 characters' });
  }

  // Sanitize: trim whitespace
  req.body.query = query.trim();

  if (req.body.query.length === 0) {
    return res.status(400).json({ success: false, message: 'Query cannot be empty' });
  }

  next();
}
