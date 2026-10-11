import React from 'react';
import {
  LayoutDashboard,
  Target,
  Clock,
  Truck,
  Menu,
  Layers,
  Users,
  FileText
} from 'lucide-react';

export default function MobileBottomNav({
  currentPage,
  onNavigate,
  onOpenSidebar
}) {
  const isVehiclesActive = currentPage === 'vehicle-loading' || currentPage === 'vehicle-unloading';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {/* 1. Dashboard */}
      <button
        type="button"
        className={`mobile-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </button>

      {/* 2. Daily Target */}
      <button
        type="button"
        className={`mobile-nav-item ${currentPage === 'daily-target' ? 'active' : ''}`}
        onClick={() => onNavigate('daily-target')}
      >
        <Target size={20} />
        <span>Target</span>
      </button>

      {/* 3. Hourly Scanning */}
      <button
        type="button"
        className={`mobile-nav-item ${currentPage === 'hourly-scanning' ? 'active' : ''}`}
        onClick={() => onNavigate('hourly-scanning')}
      >
        <Clock size={20} />
        <span>Hourly</span>
      </button>

      {/* 4. Vehicles (Loading / Unloading) */}
      <button
        type="button"
        className={`mobile-nav-item ${isVehiclesActive ? 'active' : ''}`}
        onClick={() => onNavigate('vehicle-unloading')}
      >
        <Truck size={20} />
        <span>Vehicles</span>
      </button>

      {/* 5. Full Menu Drawer */}
      <button
        type="button"
        className="mobile-nav-item"
        onClick={onOpenSidebar}
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  );
}
