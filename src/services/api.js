import { loadSpaces as getLocalSpaces, saveSpaces as setLocalSpaces } from './v2storage.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let token = localStorage.getItem('cognix_token') || null;

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

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API Request Failed');
    return data;
  } catch (err) {
    console.warn(`[API Fallback] Endpoint ${endpoint} unreachable: ${err.message}. Using local storage fallback.`);
    return null;
  }
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
