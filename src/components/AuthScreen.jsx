import React, { useState } from 'react';
import { apiAuth } from '../services/api.js';

export function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!name) {
        setError('Please provide your name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await apiAuth.login(email, password);
      } else {
        res = await apiAuth.register(name, email, password);
      }

      if (res?.success && res?.data?.user) {
        onAuthenticated(res.data.user);
      } else {
        setError(res?.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authOverlay">
      <div className="authCard glass">
        <div className="brand flexCenter">
          <span className="brandMark">✦</span>
          <div>
            <b>COGNIX</b>
            <small>GAMELEARN AI</small>
          </div>
        </div>

        <div className="authEyebrow">SMART ADAPTIVE LEARNING ADVENTURE</div>
        <h2 className="authTitle">
          {mode === 'login' ? 'Welcome Back, Learner' : 'Create Your DNA Account'}
        </h2>
        <p className="muted authSub">
          {mode === 'login'
            ? 'Sign in to access your Learning Spaces, worlds, notes, and DNA progression.'
            : 'Register to unlock dynamic syllabus-to-world generation and adaptive game adventures.'}
        </p>

        <div className="authTabs">
          <button
            className={`authTab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            className={`authTab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <div className="authErrorBanner">{error}</div>}

        <form onSubmit={handleSubmit} className="authForm">
          {mode === 'register' && (
            <div className="fieldGroup">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="fieldGroup">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. learner@cognix.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="fieldGroup">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="fieldGroup">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="primary full authSubmitBtn" disabled={loading}>
            {loading ? 'Authenticating...' : mode === 'login' ? 'Log In to Cognix' : 'Create DNA Profile'}
          </button>
        </form>

        <div className="authFooter muted">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button className="textLink" onClick={() => setMode('register')}>
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button className="textLink" onClick={() => setMode('login')}>
                Log in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
