import React from 'react';
import {
  LayoutDashboard,
  Target,
  Clock,
  Layers,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Eye,
  FileText,
  LogOut,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { SHIFT_DETAILS } from '../utils/dateUtils';

const MENU_ITEMS = [

  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'daily-target', label: 'Daily Target', icon: Target },
  { id: 'hourly-scanning', label: 'Hourly Scanning', icon: Clock },
  { id: 'batch-production', label: 'Batch Production', icon: Layers },
  { id: 'vehicle-loading', label: 'Vehicle Loading', icon: ArrowUpFromLine },
  { id: 'vehicle-unloading', label: 'Vehicle Unloading', icon: ArrowDownToLine },
  { id: 'attendance', label: 'Attendance', icon: Users },
  { id: 'seen-list', label: 'Seen List', icon: Eye },
  { id: 'daily-summary', label: 'Daily Summary', icon: FileText }
];

export default function Sidebar({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  isOpen,
  onClose
}) {
  const isViewerRole = currentUser?.role === 'VIEWER';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand / Department Header with Official Aditya Birla Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-img-wrapper">
            <img
              src="/logo.png"
              alt="Aditya Birla Lifestyle Brands"
              className="sidebar-official-logo"
            />
          </div>
          <div className="sidebar-title">
            <span className="sidebar-title-main">ADITYA BIRLA</span>
            <span className="sidebar-title-sub">Lifestyle Brands</span>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: '1px' }}>
              Refinishing Department
            </span>
          </div>
        </div>


        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  if (onClose) onClose();
                }}
              >
                <IconComponent className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Working Hours & Shift Reminder */}
        <div className="sidebar-footer">
          <div className="sidebar-shift-card">
            <div className="title">
              <Clock size={13} />
              <span>General Shift (1 Shift)</span>
            </div>
            <div>Hours: <strong>{SHIFT_DETAILS.startTime} – {SHIFT_DETAILS.endTime}</strong></div>
            <div style={{ marginTop: '2px', color: '#94a3b8' }}>Lunch: {SHIFT_DETAILS.lunchBreak}</div>
          </div>

          {/* Current Role status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Current Role:</span>
            <span className={`badge badge-role ${isViewerRole ? 'viewer' : ''}`}>
              {currentUser?.role || 'GUEST'}
            </span>
          </div>

          {/* Logout Button */}
          <button type="button" className="sidebar-logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
