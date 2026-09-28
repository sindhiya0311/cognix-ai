// Shared helpers for the Phase 1 automated test suite (node:test).
//
// Every test file boots its OWN server process on its own port with an
// isolated database and a dedicated test JWT secret. No test ever touches
// the developer's running server, the developer's database, or any real
// credentials.
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const TEST_MONGODB_URI = 'mongodb://localhost:27017/cognix_phase1_test';
export const TEST_JWT_SECRET = 'cognix-phase1-test-secret-9f8e7d6c5b4a32109f8e7d6c5b4a3210';

export function childEnv(overrides = {}) {
  return {
    ...process.env,
    MONGODB_URI: TEST_MONGODB_URI,
    JWT_SECRET: TEST_JWT_SECRET,
    ...overrides
  };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Boots server/server.js on `port` and waits for /api/health. */
export async function startServer(port) {
  const proc = spawn(process.execPath, ['server/server.js'], {
    cwd: ROOT,
    env: childEnv({ PORT: String(port) }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  proc.stdout.on('data', chunk => { output += chunk; });
  proc.stderr.on('data', chunk => { output += chunk; });

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      throw new Error(`server exited early (code ${proc.exitCode}):\n${output}`);
    }
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return { proc, base, output: () => output };
    } catch {
      /* not listening yet */
    }
    await sleep(250);
  }
  await stopServer(proc);
  throw new Error(`server did not become healthy:\n${output}`);
}

export function stopServer(proc) {
  return new Promise(resolve => {
    if (!proc || proc.exitCode !== null) return resolve();
    const timer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch { /* already gone */ }
      resolve();
    }, 4000);
    if (typeof timer.unref === 'function') timer.unref();
    proc.once('exit', () => { clearTimeout(timer); resolve(); });
    proc.kill();
  });
}

/**
 * Boots the server in a scratch working directory (no .env can be picked up)
 * with the given environment and waits for it to exit.
 * Used to prove startup FAILS without a valid JWT secret.
 */
export function runServerToExit(overrides = {}, timeoutMs = 15000) {
  const env = { ...process.env, ...overrides };
  if (!('JWT_SECRET' in overrides)) delete env.JWT_SECRET;

  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], {
      cwd: os.tmpdir(),
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    proc.stdout.on('data', chunk => { output += chunk; });
    proc.stderr.on('data', chunk => { output += chunk; });
    const timer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch { /* ignore */ }
      reject(new Error(`server did not exit within ${timeoutMs}ms:\n${output}`));
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();
    proc.once('exit', code => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}

/** Thin fetch wrapper returning { status, data, headers }. */
export async function api(base, endpoint, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${base}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data, headers: res.headers };
}

/** Registers a unique user and returns { token, user, email, password }. */
export async function registerUser(base, tag) {
  const email = `${tag}.${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}@phase1.test`;
  const password = 'Phase1!TestSecret';
  const res = await api(base, '/api/auth/register', {
    method: 'POST',
    body: { name: `Phase1 ${tag}`, email, password }
  });
  if (res.status !== 201 || !res.data?.data?.token) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.data.token, user: res.data.data.user, email, password };
}

/** Creates a learning space and returns the created server document. */
export async function createSpace(base, token, name = 'Phase1 Space') {
  const res = await api(base, '/api/spaces', {
    method: 'POST',
    token,
    body: { name, subject: 'Testing', description: '' }
  });
  if ((res.status !== 200 && res.status !== 201) || !res.data?.data) {
    throw new Error(`createSpace failed: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data.data;
}

/** Fetches a space (with its worlds) as the given user. */
export async function getSpace(base, token, spaceId) {
  const res = await api(base, `/api/spaces/${spaceId}`, { token });
  return res;
}
