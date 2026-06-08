import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const SETTINGS_KEY = 'fa_settings';

function loadSettings(username) {
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return all[username] ?? {
      showAiReason: true,
      autoSaveWatchlist: true,
      compactCards: false,
      preferDark: true,
    };
  } catch {
    return { showAiReason: true, autoSaveWatchlist: true, compactCards: false, preferDark: true };
  }
}

function saveSettings(username, settings) {
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    all[username] = settings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
  } catch {}
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="settings-toggle">
      <div className="settings-toggle__text">
        <span className="settings-toggle__label">{label}</span>
        {description && <span className="settings-toggle__desc">{description}</span>}
      </div>
      <div
        className={`settings-toggle__switch ${checked ? 'on' : ''}`}
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange()}
      >
        <div className="settings-toggle__knob" />
      </div>
    </label>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(() => loadSettings(user?.username ?? ''));
  const [saved, setSaved] = useState(false);

  function toggle(key) {
    setSettings(s => {
      const next = { ...s, [key]: !s[key] };
      saveSettings(user?.username ?? '', next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <main className="settings-page">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          {saved && <span className="settings-saved">✓ Saved</span>}
        </div>

        <section className="settings-section">
          <p className="settings-section-label">Display</p>
          <div className="settings-card">
            <Toggle
              label="Show AI reason"
              description="Display why a movie was recommended on each card"
              checked={settings.showAiReason}
              onChange={() => toggle('showAiReason')}
            />
            <Toggle
              label="Compact cards"
              description="Smaller movie cards for more content on screen"
              checked={settings.compactCards}
              onChange={() => toggle('compactCards')}
            />
            <Toggle
              label="Dark mode"
              description="Always use the dark theme (currently only dark is available)"
              checked={settings.preferDark}
              onChange={() => toggle('preferDark')}
            />
          </div>
        </section>

        <section className="settings-section">
          <p className="settings-section-label">Watchlist</p>
          <div className="settings-card">
            <Toggle
              label="Auto-save liked films"
              description="Automatically add films you swipe right to your watchlist"
              checked={settings.autoSaveWatchlist}
              onChange={() => toggle('autoSaveWatchlist')}
            />
          </div>
        </section>

        <section className="settings-section">
          <p className="settings-section-label">About your data</p>
          <div className="settings-card settings-card--info">
            <p>
              All settings and account data are stored locally in your browser using localStorage.
              No data is sent to any server. Clearing your browser data will reset everything.
            </p>
          </div>
        </section>
      </Motion.div>
    </main>
  );
}
