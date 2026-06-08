import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const USERS_KEY    = 'fa_users';
const SESSION_KEY  = 'fa_session';

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
function writeUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  function _persist(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }

  function signup({ username, email, password }) {
    const users = readUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
      throw new Error('Username already taken.');
    if (email && users.find(u => u.email === email))
      throw new Error('Email already registered.');
    const record = { username, email, password, createdAt: Date.now() };
    writeUsers([...users, record]);
    _persist({ username, email, isGuest: false });
  }

  function login({ username, password }) {
    const found = readUsers().find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!found) throw new Error('Wrong username or password.');
    _persist({ username: found.username, email: found.email, isGuest: false });
  }

  function loginAsGuest() {
    _persist({ username: 'Guest', email: null, isGuest: true });
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signup, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
