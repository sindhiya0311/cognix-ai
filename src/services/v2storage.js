// User-scoped local cache for learning spaces (Phase 1 isolation).
//
// Contract:
//   - cache keys are namespaced per authenticated user: cognix_v2:<userId>
//   - anonymous/default state uses cognix_v2:anon and never inherits
//     another account's data
//   - the legacy global key (cognix_v2) is unattributable — its ownership
//     can't be proven — so it is dropped, never migrated
//   - logout DETACHES the active namespace (the signed-in user's cache stays
//     under their own key for their next sign-in; other accounts never see it)
//   - the server remains authoritative; this is only a cache

const LEGACY_KEY = 'cognix_v2';
const ANONYMOUS = 'anon';

let activeUserId = ANONYMOUS;

/** Pure key builder — unit tested. */
export function spacesKey(userId) {
  const id = typeof userId === 'string' && userId.trim() ? userId.trim() : ANONYMOUS;
  return `cognix_v2:${id}`;
}

/**
 * Reads the user id out of our own JWT payload (namespace hint only —
 * never used for authorization; the server verifies every token).
 */
export function userIdFromToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.id === 'string' && payload.id ? payload.id : null;
  } catch {
    return null;
  }
}

/** Switches the active cache namespace (pass null for anonymous). */
export function setActiveUser(userId) {
  activeUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : ANONYMOUS;
}

export function activeSpacesKey() {
  return spacesKey(activeUserId);
}

export function loadSpaces() {
  try {
    const raw = localStorage.getItem(spacesKey(activeUserId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSpaces(value) {
  try {
    localStorage.setItem(spacesKey(activeUserId), JSON.stringify(value));
  } catch {
    /* storage unavailable/quota — cache is best-effort */
  }
}

/** Removes the legacy un-scoped cache whose ownership cannot be proven. */
export function dropLegacyGlobalSpaces() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
