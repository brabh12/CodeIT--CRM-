import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Top Mobile Bar (visible on <768px screens) */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
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

        <button 
          type="button" 
          className="mobile-header-toggle"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      <Sidebar 
        isOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

