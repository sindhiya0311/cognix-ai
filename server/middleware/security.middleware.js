import LearningSpace from '../models/LearningSpace.js';
import World from '../models/World.js';
import { RATE_LIMITS } from '../config/security.config.js';

/**
 * In-memory rate limiting (Phase 1).
 *
 * Known limitation (documented in vish.md): a single process only.
 * Distributed rate limiting (Redis) will be handled in a later phase.
 * The generic limiter keys per user/IP + URL; the dedicated authentication
 * limiters below deliberately do NOT include the URL in their key so they
 * cannot be bypassed by varying the path.
 */

const rateLimitStore = new Map();

function consume(key, windowMs, max) {
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    entry = { windowStart: now, count: 0, windowMs };
    rateLimitStore.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > max) {
    return { ok: false, retryAfterMs: Math.max(1000, windowMs - (now - entry.windowStart)) };
  }
  return { ok: true };
}

// Single shared cleanup pass for every limiter (unref'd: never keeps the process alive).
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > entry.windowMs) rateLimitStore.delete(key);
  }
}, 60 * 1000);
if (typeof sweeper.unref === 'function') sweeper.unref();

function reject429(res, retryAfterMs, message) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.set('Retry-After', String(retryAfterSeconds));
  return res.status(429).json({
    success: false,
    message,
    retryAfterMs,
    retryAfterSeconds
  });
}

/**
 * Generic per-user (or per-IP) + per-URL limiter.
 * Used by the game API bucket and NOVA. Keeps its historical keying so no
 * existing behaviour changes beyond the added Retry-After header.
 */
export function rateLimit({ windowMs = 60000, maxRequests = 20, message = 'Too many requests, please try again later' } = {}) {
  return (req, res, next) => {
    const identity = req.user?.id || req.ip || 'unknown';
    const key = `${identity}:${req.originalUrl}`;
    const result = consume(key, windowMs, maxRequests);
    if (!result.ok) {
      return reject429(res, result.retryAfterMs, message);
    }
    next();
  };
}

const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

/**
 * Authentication brute-force limiter for POST /api/auth/login.
 * Two buckets, both WITHOUT the URL in the key (no path-varying bypass):
 *   1) per source IP        — stops distributed-account spraying from one host
 *   2) per submitted email  — stops password guessing against one account
 * The account bucket counts attempts identically whether or not the account
 * exists, so 429 behaviour cannot be used to probe account existence.
 */
export function loginRateLimit() {
  const { loginPerIp, loginPerAccount } = RATE_LIMITS;
  return (req, res, next) => {
    const ipResult = consume(`auth:login:ip:${clientIp(req)}`, loginPerIp.windowMs, loginPerIp.max);
    if (!ipResult.ok) return reject429(res, ipResult.retryAfterMs, loginPerIp.message);

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email) {
      const accountResult = consume(`auth:login:acct:${email}`, loginPerAccount.windowMs, loginPerAccount.max);
      if (!accountResult.ok) return reject429(res, accountResult.retryAfterMs, loginPerAccount.message);
    }
    next();
  };
}

/** Registration limiter (bulk account creation), per source IP. */
export function registerRateLimit() {
  const { registerPerIp } = RATE_LIMITS;
  return (req, res, next) => {
    const result = consume(`auth:register:ip:${clientIp(req)}`, registerPerIp.windowMs, registerPerIp.max);
    if (!result.ok) return reject429(res, result.retryAfterMs, registerPerIp.message);
    next();
  };
}

/* ------------------------------------------------------------------ *
 * NOVA trust boundary.
 *
 * CLIENT IS UNTRUSTED. The identity always comes from the verified JWT
 * (set by `protect`); any space/world reference in the body must belong to
 * that user. Client context is accepted only as advisory display context:
 * identity fields are stripped and, when a space is verified, the
 * server-owned name/subject override the client's values.
 * ------------------------------------------------------------------ */
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const isObjectId = value => typeof value === 'string' && OBJECT_ID.test(value);
const IDENTITY_KEYS = ['userId', 'ownerId', 'accountId', 'user'];

export async function verifyNovaContext(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid request body' });
    }

    // Identity never comes from the request body.
    for (const key of IDENTITY_KEYS) delete req.body[key];

    const ctx = (req.body.context && typeof req.body.context === 'object' && !Array.isArray(req.body.context))
      ? req.body.context
      : {};
    for (const key of IDENTITY_KEYS) delete ctx[key];

    const refSpaceId = isObjectId(ctx?.learningSpace?.id)
      ? ctx.learningSpace.id
      : (isObjectId(req.body.spaceId)
          ? req.body.spaceId
          : (isObjectId(req.body.space?.id) ? req.body.space.id : null));
    const refWorldId = isObjectId(ctx?.world?.id)
      ? ctx.world.id
      : (isObjectId(req.body.worldId)
          ? req.body.worldId
          : (isObjectId(req.body.world?.id) ? req.body.world.id : null));

    if (refSpaceId) {
      const space = await LearningSpace.findById(refSpaceId).select('name subject userId');
      if (!space) return res.status(404).json({ success: false, message: 'Learning space not found' });
      // Fail closed: an unowned or ownerless space is never usable.
      if (!space.userId || space.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to use this learning space' });
      }
      ctx.learningSpace = {
        ...(ctx.learningSpace && typeof ctx.learningSpace === 'object' ? ctx.learningSpace : {}),
        id: space._id.toString(),
        name: space.name,          // server-owned, overrides any client value
        subject: space.subject     // server-owned, overrides any client value
      };
      ctx.verifiedSpaceId = space._id.toString();
    } else if (ctx.learningSpace && typeof ctx.learningSpace === 'object') {
      // Local/seed identifiers are not server references: keep the display
      // fields but drop the id so it can never act as an identifier.
      const { id, _id, ...display } = ctx.learningSpace;
      ctx.learningSpace = display;
    }

    if (refWorldId) {
      const world = await World.findById(refWorldId).select('learningSpaceId name');
      if (!world) return res.status(404).json({ success: false, message: 'World not found' });
      const worldSpace = await LearningSpace.findById(world.learningSpaceId).select('userId');
      if (!worldSpace || !worldSpace.userId || worldSpace.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to use this world' });
      }
      if (refSpaceId && world.learningSpaceId.toString() !== refSpaceId) {
        return res.status(403).json({ success: false, message: 'World does not belong to the referenced learning space' });
      }
    }

    const hadContext = !!(req.body.context && typeof req.body.context === 'object' && !Array.isArray(req.body.context));
    if (hadContext || Object.keys(ctx).length > 0) {
      req.body.context = ctx;
    }
    next();
  } catch (error) {
    next(error);
  }
}
