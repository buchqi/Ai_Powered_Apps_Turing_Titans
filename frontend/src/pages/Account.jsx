import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!user) return null;

  const joined = (() => {
    try {
      const users = JSON.parse(localStorage.getItem('fa_users')) || [];
      const record = users.find(u => u.username === user.username);
      if (record) {
        return new Date(record.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
      }
    } catch { }
    return 'Unknown';
  })();

  return (
    <main className="account-page">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="account-header">
          <div className="account-avatar">{user.username.slice(0, 2).toUpperCase()}</div>
          <div>
            <h1 className="account-name">{user.username}</h1>
            {user.email && <p className="account-email">{user.email}</p>}
          </div>
        </div>

        <div className="account-cards">
          <div className="account-info-card">
            <p className="account-info-label">Member since</p>
            <p className="account-info-value">{joined}</p>
          </div>
          <div className="account-info-card">
            <p className="account-info-label">Account type</p>
            <p className="account-info-value">Free</p>
          </div>
        </div>

        <hr className="about-divider" />

        <section className="account-section">
          <h2 className="account-section-title">Manage Account</h2>
          <p className="account-section-desc">
            Your data is stored locally in this browser. Clearing browser data will remove your account.
          </p>
          <div style={{ marginTop: '2vh', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn-ghost"
              onClick={() => navigate('/settings')}
            >
              ⚙️  Settings
            </button>
            <button
              className="btn-ghost btn-ghost--danger"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </section>
      </Motion.div>
    </main>
  );
}
