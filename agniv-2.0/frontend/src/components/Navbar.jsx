import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Flame, 
  LayoutDashboard, 
  Camera, 
  Shield, 
  MapPin, 
  LogOut, 
  Plus 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/fire-station', label: 'Fire Station', icon: Shield },
    { path: '/verify', label: 'Face Verify', icon: Camera },
    { path: '/add-property', label: 'Add Property', icon: Plus },
  ];

  // Helper to truncate email
  const truncateEmail = (email) => {
    if (!email) return '';
    return email.length > 20 ? email.substring(0, 17) + '...' : email;
  };

  return (
    <nav 
      className="bg-[#0a0a12]/80 backdrop-blur-md border-b border-white/10"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: '64px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Left side */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <Flame className="text-[#ff4500] w-6 h-6 animate-pulse" />
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-fire-500 to-[#ff8c00] bg-clip-text text-transparent font-sans">
              Agniv 2.0
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'text-fire-500 bg-white/5 border border-fire-500/20' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side Actions (User info + Logout) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right text-xs">
              <span className="text-gray-400 block font-light">Logged in as</span>
              <span className="text-white font-medium block truncate max-w-[150px]" title={user?.email}>
                {truncateEmail(user?.email)}
              </span>
            </div>
            <button
              onClick={handleLogoutClick}
              className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border-red-500/10 hover:border-red-500/30"
              style={{ borderRadius: '6px' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0a0a12]/95 border-b border-white/10">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-semibold ${
                  isActive 
                    ? 'text-fire-500 bg-white/5' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          
          {/* User Email & Logout in mobile view */}
          <div className="border-t border-white/5 pt-4 mt-2 px-3 pb-2 flex flex-col gap-2">
            <div className="text-xs text-gray-400">
              Logged in as: <span className="text-white font-medium block truncate mt-0.5">{user?.email}</span>
            </div>
            <button
              onClick={() => { setIsOpen(false); handleLogoutClick(); }}
              className="btn-ghost w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-red-400 border-red-500/10 hover:border-red-500/30"
              style={{ borderRadius: '6px' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
