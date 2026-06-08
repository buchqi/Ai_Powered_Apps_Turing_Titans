import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      signup({ username: form.username, email: form.email, password: form.password });
      navigate('/match');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    loginAsGuest();
    navigate('/match');
  }

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  return (
    <main className="auth-page">
      <Motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-card__brand">🎬</div>
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__sub">Start building your shared watchlist</p>

        {error && <div className="auth-card__error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Username
            <input
              className="auth-input"
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="film_lover"
              required
              autoFocus
            />
          </label>

          <label className="auth-label">
            Email <span className="auth-label__hint">(for recovery only, not verified)</span>
            <input
              className="auth-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="min. 6 characters"
              required
            />
          </label>

          <label className="auth-label">
            Confirm Password
            <input
              className="auth-input"
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="••••••••"
              required
            />
          </label>

          <button className="btn-gold btn-gold--full" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn-ghost btn-ghost--full" onClick={handleGuest}>
          Continue as Guest
        </button>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </Motion.div>
    </main>
  );
}
