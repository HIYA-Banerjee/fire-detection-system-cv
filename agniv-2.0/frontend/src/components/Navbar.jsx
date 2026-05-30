import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Flame } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/fire-station', label: 'Fire Station' },
    { path: '/verify', label: 'Face Verify' },
    { path: '/add-property', label: 'Add Property' },
  ];

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(10,10,18,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        gap: '0'
      }}
    >
      {/* SECTION 1 — LEFT: Logo only */}
      <div 
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px', cursor: 'pointer' }}
      >
        <Flame style={{ color: '#ff4500', width: '24px', height: '24px' }} />
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#ff4500', fontFamily: 'sans-serif' }}>
          Agniv 2.0
        </span>
      </div>

      {/* SECTION 2 — CENTER: Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {navLinks.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                ...(isActive ? {
                  background: 'rgba(255, 69, 0, 0.15)',
                  color: '#ff4500',
                  border: '1px solid rgba(255, 69, 0, 0.3)'
                } : {
                  background: hoveredIdx === idx ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  color: hoveredIdx === idx ? '#fff' : '#aaa',
                  border: '1px solid transparent'
                })
              }}
            >
              {link.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 3 — RIGHT: User info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#888' }}>Logged in as</div>
          <div style={{ fontSize: '13px', color: '#ddd', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user?.email}>
            {user?.email}
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', 
            padding: '8px 14px', 
            borderRadius: '8px',
            fontSize: '13px', 
            fontWeight: '600', 
            cursor: 'pointer', 
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          → Logout
        </button>
      </div>
    </nav>
  );
}
