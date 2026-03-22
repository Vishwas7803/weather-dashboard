import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar({ city }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <div className="navbar-brand">
          <span className="brand-icon">🌤</span>
          <span className="brand-text">WeatherSense</span>
        </div>

        {city && (
          <div className="navbar-location">
            <span className="loc-icon">📍</span>
            <span>{city}</span>
          </div>
        )}

        <button className="nav-hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setOpen(false)}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Current Weather
          </NavLink>
          <NavLink to="/historical" onClick={() => setOpen(false)}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Historical Data
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
