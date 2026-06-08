import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ likedCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  const initials = user
    ? user.isGuest
      ? '👤'
      : user.username.slice(0, 2).toUpperCase()
    : null;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <NavLink to="/" className="navbar__logo" aria-label="Film Adviser home">
        🎬 <span>Film Adviser</span>
      </NavLink>

      <div className="navbar__links">
        <NavLink
          to="/match"
          className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
        >
          Match
        </NavLink>

        <NavLink
          to="/watchlist"
          className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
          aria-label={`Watchlist, ${likedCount} saved`}
        >
          Watchlist
          {likedCount > 0 && (
            <span className="navbar__badge" aria-hidden="true">{likedCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
        >
          About
        </NavLink>

        {user ? (
          <div className="navbar__user-menu" ref={menuRef}>
            <button
              className="navbar__avatar"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="User menu"
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="navbar__dropdown">
                <div className="navbar__dropdown-name">
                  {user.isGuest ? 'Guest Mode' : user.username}
                </div>
                {!user.isGuest && (
                  <>
                    <NavLink
                      to="/account"
                      className="navbar__dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
                    </NavLink>
                    <NavLink
                      to="/settings"
                      className="navbar__dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </NavLink>
                  </>
                )}
                <button className="navbar__dropdown-item navbar__dropdown-logout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar__auth-btns">
            <NavLink to="/login"  className="navbar__link">Log In</NavLink>
            <NavLink to="/signup" className="btn-gold btn-gold--sm">Sign Up</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
