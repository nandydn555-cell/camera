import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Camera, Menu, X, Search, UserRound, ShoppingBag } from 'lucide-react';
import { useStore } from '../state/StoreContext';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/cameras', label: 'Cameras' },
  { to: '/accessories', label: 'Accessories' },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartCount, user, setAuthMode, setAuthOpen } = useStore();
  const navigate = useNavigate();

  const openAccount = () => {
    if (user) navigate('/profile');
    else {
      setAuthMode('login');
      setAuthOpen(true);
    }
  };

  return (
    <header className="topbar">
      <button className="hamburger" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
        {mobileOpen ? <X /> : <Menu />}
      </button>
      <Link className="wordmark" to="/" aria-label="Lensline home">
        <span className="mark"><Camera size={19} /></span> LENS<span>LINE</span>
      </Link>
      <nav className={mobileOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
        {navItems.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="top-actions">
        <Link className="icon-action search-toggle" to="/shop" aria-label="Search products"><Search size={19} /></Link>
        <button className="icon-action account-action" onClick={openAccount} aria-label={user ? 'Your account' : 'Sign in'}><UserRound size={19} /></button>
        <Link className="bag-action" to="/cart" aria-label={`Shopping bag, ${cartCount} items`}>
          <ShoppingBag size={19} /><span>Bag</span>{cartCount > 0 && <i>{cartCount}</i>}
        </Link>
      </div>
    </header>
  );
}
