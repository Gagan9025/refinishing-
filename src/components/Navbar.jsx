import React from 'react';
import { Menu, Clock, User, RotateCcw, ShieldCheck } from 'lucide-react';
import DateSelector from './DateSelector';
import { getCurrentHourSlot } from '../utils/dateUtils';
import { Storage } from '../utils/storage';

export default function Navbar({
  selectedDate,
  onDateChange,
  currentUser,
  onToggleSidebar,
  onRefreshData
}) {
  const currentSlot = getCurrentHourSlot();
  const isDataEntry = currentUser?.role === 'DATA ENTRY';

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to default records? Your temporary entries will be replaced with clean demo records.')) {
      Storage.resetToMockData();
      if (onRefreshData) onRefreshData();
      window.location.reload();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="nav-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="Aditya Birla Logo"
            style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
          />
          <span className="navbar-brand-mobile" style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1e3a8a' }}>
            ADITYA BIRLA
          </span>
        </div>

        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>


      <div className="navbar-right">
        {/* Current Active Working Slot */}
        <div className="shift-indicator" title="Current scheduled working period">
          <Clock size={13} style={{ color: 'var(--color-accent)' }} />
          <span>Active Hour: <strong>{currentSlot}</strong></span>
        </div>

        {/* Demo reset button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleResetData}
          title="Reset to initial sample mock records"
        >
          <RotateCcw size={13} />
          <span className="desktop-only" style={{ fontSize: '0.75rem' }}>Reset Demo</span>
        </button>

        {/* User Profile & Role */}
        <div className="user-profile-badge">
          <div className="user-avatar" title={`User ID: ${currentUser?.id}`}>
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser?.name || 'User'}</span>
            <span
              className={`badge badge-role ${!isDataEntry ? 'viewer' : ''}`}
              style={{ padding: '1px 6px', fontSize: '0.68rem', marginTop: '1px' }}
            >
              {currentUser?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
