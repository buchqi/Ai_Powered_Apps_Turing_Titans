import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  authLogin,
  authRegister,
  getCurrentUser,
  logout as clearAuthSession,
} from '../api/auth.js';
import { AuthError } from '../api/client.js';
import { clearAccessToken } from '../lib/token-storage.js';

const AuthContext = createContext(null);

const GUEST_SESSION_KEY = 'fa_guest_session';

function readGuestSession() {
  try { return JSON.parse(sessionStorage.getItem(GUEST_SESSION_KEY)); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readGuestSession);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!isMounted || !currentUser) return;
        sessionStorage.removeItem(GUEST_SESSION_KEY);
        setUser({ ...currentUser, isGuest: false });
      })
      .catch((err) => {
        if (err instanceof AuthError) {
          clearAccessToken();
        }
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    await authLogin({ email, password });
    const currentUser = await getCurrentUser();
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    setUser({ ...currentUser, isGuest: false });
    return currentUser;
  }, []);

  const signup = useCallback(async ({ username, email, password }) => {
    await authRegister({ username, email, password });
    return login({ email, password });
  }, [login]);

  const loginAsGuest = useCallback(() => {
    clearAuthSession();
    const guest = { username: 'Guest', email: null, isGuest: true };
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guest));
    setUser(guest);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup, login, loginAsGuest, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
