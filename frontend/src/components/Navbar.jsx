import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar({ likedCount }) {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <NavLink to="/" className="navbar__logo" aria-label="Film Adviser home">
        ✦ <span>Film Adviser</span>
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
            <span className="navbar__badge" aria-hidden="true">
              {likedCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
        >
          About
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;