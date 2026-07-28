import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, KeyRound, ShoppingCart, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (onClose) onClose();
      await logout();
      addToast('Logged out successfully', 'info');
      navigate('/login');
    } catch (err) {
      addToast(err.message || 'Logout failed', 'error');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Accounts', path: '/accounts', icon: KeyRound },
    { label: 'Orders', path: '/orders', icon: ShoppingCart },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{
              width: '20px', 
              height: '20px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--color-accent)', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700
            }}>
              C
            </div>
            <span>CodeIt CRM</span>
          </div>
          
          {onClose && (
            <button 
              type="button" 
              className="mobile-header-toggle sidebar-close-btn"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onClose && onClose()}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

