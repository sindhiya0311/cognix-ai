import { loadSpaces as getLocalSpaces, saveSpaces as setLocalSpaces } from './v2storage.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let token = localStorage.getItem('cognix_token') || null;
let unauthorizedHandler = null;

/**
 * HTTP-layer error carrying the response status so callers can distinguish:
 *   401 → authentication failed (auth state already cleared by request()),
 *   403 → authenticated but not authorized (session preserved — surface it),
 *   other → ordinary failures with the server's safe message preserved.
 * Network/unreachable failures do NOT throw: they return null so the
 * existing offline/local-cache fallback keeps working.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Registered by the app to transition into a safe unauthenticated state
 * when the server rejects an otherwise-active session (401).
 */
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

export const setAuthToken = (t) => {
  token = t;
  if (t) localStorage.setItem('cognix_token', t);
  else localStorage.removeItem('cognix_token');
};

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    // Offline/unreachable: preserved fallback behaviour — callers may use
    // their local cache. Authentication failures never arrive via this path.
    console.warn(`[API Offline] Endpoint ${endpoint} unreachable: ${err.message}. Using local storage fallback where supported.`);
    return null;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (res.ok) return data;

  const message = (data && typeof data.message === 'string' && data.message)
    || `Request failed (${res.status})`;

  if (res.status === 401) {
    const hadSession = !!token;
    if (hadSession) {
      setAuthToken(null);       // clear invalid auth state
      unauthorizedHandler?.();  // transition to a safe unauthenticated state
    }
    throw new ApiError(message, 401);
  }

  // 403 keeps the session; every caller surfaces it instead of swallowing it.
  throw new ApiError(message, res.status);
}

// Authentication API
export const apiAuth = {
  register: async (name, email, password) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (res?.data?.token) setAuthToken(res.data.token);
    return res;
  },
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res?.data?.token) setAuthToken(res.data.token);
    return res;
  },
  getMe: async () => request('/auth/me')
};

// Learning Spaces API
export const apiSpaces = {
  getSpaces: async () => {
    const res = await request('/spaces');
    if (res?.success && res?.data) {
      return res.data;
    }
    // Network/empty → local cache (offline resilience).
    // 401/403 throw before reaching this line: never fall back to local data
    // while unauthenticated or unauthorized.
    return getLocalSpaces();
  },
  createSpace: async (name, subject = 'Programming', description = '') => {
    const res = await request('/spaces', {
      method: 'POST',
      body: JSON.stringify({ name, subject, description })
    });
    return res?.data || null;
  },
  deleteSpace: async (id) => {
    const res = await request(`/spaces/${id}`, {
      method: 'DELETE'
    });
    return res?.success || false;
  },
  saveSpaces: async (spaces) => {
    setLocalSpaces(spaces); // Always sync to local storage for offline resilience
  }
};

// Syllabus API
export const apiSyllabus = {
  renderSyllabus: async (spaceId, title, units) => {
    const res = await request(`/spaces/${spaceId}/syllabus`, {
      method: 'POST',
      body: JSON.stringify({ title, units })
    });
    return res?.data || null;
  }
};

// Game / Attempt API
export const apiGame = {
  submitAttempt: async (spaceId, worldId, result) => {
    const res = await request('/games/attempt', {
      method: 'POST',
      body: JSON.stringify({ spaceId, worldId, ...result })
    });
    return res?.data || null;
  }
};

// Resources API
export const apiResources = {
  addResource: async (spaceId, resource) => {
    const res = await request(`/spaces/${spaceId}/resources`, {
      method: 'POST',
      body: JSON.stringify(resource)
    });
    return res?.data || null;
  }
};

// Nova AI Mentor API
export const apiNova = {
  ask: async (space, world, decision, query) => {
    const res = await request('/nova/ask', {
      method: 'POST',
      body: JSON.stringify({ space, world, decision, query })
    });
    return res?.reply || null;
  },
  askContextual: async (context, query) => {
    const res = await request('/nova/ask', {
      method: 'POST',
      body: JSON.stringify({ context, query })
    });
    return res?.reply || null;
  }
};
