/**
 * Centralized security configuration for Cognix (Phase 1).
 *
 * Every security boundary introduced in Phase 1 reads its limits and
 * allowlists from this file so that policy changes happen in exactly one place.
 * CLIENT IS UNTRUSTED: the server owns identity, ownership, correctness,
 * mastery, XP, progression, unlocks and learner state wherever those values
 * are already server-computable.
 */

/* ------------------------------------------------------------------ *
 * Rate limiting (in-memory, single process).
 * Distributed rate limiting (e.g. Redis) is intentionally deferred to a
 * later phase — see vish.md "Remaining limitations".
 * ------------------------------------------------------------------ */
export const RATE_LIMITS = {
  // Brute-force protection for POST /api/auth/login.
  // Keyed twice: per source IP and per submitted account identifier.
  // The account bucket increments whether or not the account exists, so the
  // limiter never reveals account existence.
  loginPerAccount: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts for this account. Please wait a few minutes and try again.'
  },
  loginPerIp: {
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many login attempts from this device. Please wait a few minutes and try again.'
  },
  // Bulk account creation protection for POST /api/auth/register.
  registerPerIp: {
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: 'Too many accounts created from this device. Please wait and try again.'
  },
  // NOVA chat endpoint.
  nova: { windowMs: 60 * 1000, max: 20, message: 'NOVA rate limit exceeded. Please wait a moment.' },
  // Shared game/content API bucket (pre-existing behaviour, kept as-is).
  game: { windowMs: 60 * 1000, max: 30, message: 'Game API rate limit exceeded.' }
};

/* ------------------------------------------------------------------ *
 * JWT secret policy — the server refuses to start on a bad secret.
 * ------------------------------------------------------------------ */
export const JWT_SECRET_MIN_LENGTH = 32;

// Known development/documentation secrets that must never be accepted.
// (These strings are public documentation values, not real secrets.)
export const JWT_SECRET_FORBIDDEN = ['gamelearn_secret_key_mvp_2026'];

const PLACEHOLDER_PATTERN = /^(changeme|change-me|secret|password|passw0rd|example|placeholder|your[-_]?|dev[-_]?|test[-_]?|sample)/i;

/**
 * Returns a human-readable defect reason when the secret must be rejected,
 * or null when the secret is acceptable. Pure function — unit tested.
 */
export function findJwtSecretDefect(secret) {
  if (typeof secret !== 'string' || secret.trim().length === 0) {
    return 'JWT_SECRET is missing or empty.';
  }
  const value = secret.trim();
  if (JWT_SECRET_FORBIDDEN.some(known => known.toLowerCase() === value.toLowerCase())) {
    return 'JWT_SECRET must not be a known development default.';
  }
  if (value.length < JWT_SECRET_MIN_LENGTH) {
    return `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long.`;
  }
  if (PLACEHOLDER_PATTERN.test(value)) {
    return 'JWT_SECRET looks like a placeholder value.';
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Learning Space mutable-field allowlist (mass-assignment protection).
 * Only these fields may ever be written from a request body.
 * ------------------------------------------------------------------ */
export const SPACE_MUTABLE_FIELDS = ['name', 'subject', 'description'];

export const SPACE_FIELD_LIMITS = {
  name: { min: 1, max: 120 },
  subject: { min: 0, max: 120 },
  description: { min: 0, max: 2000 }
};

/* ------------------------------------------------------------------ *
 * Learning-evidence (attempt) allowlist + bounds.
 *
 * The client may only submit these fields. Privileged state (mastery, XP,
 * level, streak, unlocks, learner DNA, identity...) must never arrive in an
 * attempt body; anything else is rejected with 400.
 * `correct` remains client-asserted until server-authoritative grading lands
 * in Phase 2 — see vish.md "Remaining limitations".
 * ------------------------------------------------------------------ */
export const ATTEMPT_ALLOWED_FIELDS = [
  'spaceId',
  'worldId',
  'game',
  'correct',
  'confidence',
  'seconds',
  'difficulty',
  'hintUsed',
  'id',
  'timestamp'
];

export const GAME_TYPES = [
  'quiz',
  'flashcards',
  'puzzle',
  'scenario',
  'match',
  'sequence',
  'explore',
  'speed'
];

// Hard bounds — they cap how much a single attempt can move XP/mastery.
export const ATTEMPT_BOUNDS = {
  confidence: { min: 0, max: 1 },
  seconds: { min: 0, max: 3600 },
  difficulty: { min: 1, max: 4 }
};

/* ------------------------------------------------------------------ *
 * HTTP / payload limits.
 * ------------------------------------------------------------------ */
export const JSON_BODY_LIMIT = '100kb';      // explicit cap on request bodies
export const NOVA_QUERY_MAX_LENGTH = 1000;   // existing NOVA contract, kept
export const NOVA_CONTEXT_MAX_BYTES = 20000; // advisory context payload cap

export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
