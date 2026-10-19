import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import { Eye, ShieldAlert } from 'lucide-react';

export default function AppLayout({
  children,
  currentPage,
  onNavigate,
  selectedDate,
  onDateChange,
  currentUser,
  onLogout,
  onRefreshData,
  onlineUsers = [],
  onRefreshPresence
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isViewer = currentUser?.role === 'VIEWER';

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRefreshData={onRefreshData}
          onlineUsers={onlineUsers}
          onRefreshPresence={onRefreshPresence}
        />

        <main className="content-body">
          {/* Read-Only Notice for Viewer role */}
          {isViewer && (
            <div className="viewer-notice-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} />
                <span>
                  <strong>Viewer Mode:</strong> You are logged in as a Viewer. You can view all metrics, records, and reports. Adding and editing records is disabled.
                </span>
              </div>
              <span className="badge badge-role viewer">READ-ONLY</span>
            </div>
          )}

          {children}
        </main>

        {/* Official Company Background Watermark */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="app-official-watermark"
        />


        {/* Mobile Bottom Navigation Bar (Phone & Tablet view) */}
        <MobileBottomNav
          currentPage={currentPage}
          onNavigate={onNavigate}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      </div>
    </div>
  );
}

