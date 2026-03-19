function createMemoryRateLimit({ windowMs, max, message }) {
  const attempts = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const key = `${req.ip}:${String(req.body?.email || "").toLowerCase()}`;
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.expiresAt <= now) {
      attempts.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return res.status(429).json({ message });
    }

    current.count += 1;
    attempts.set(key, current);
    next();
  };
}

module.exports = { createMemoryRateLimit };
