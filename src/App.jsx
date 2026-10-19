import React, { useState, useEffect } from 'react';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DailyTargetPage from './pages/DailyTargetPage';
import HourlyScanningPage from './pages/HourlyScanningPage';
import BatchProductionPage from './pages/BatchProductionPage';
import VehicleLoadingPage from './pages/VehicleLoadingPage';
import VehicleUnloadingPage from './pages/VehicleUnloadingPage';
import AttendancePage from './pages/AttendancePage';
import SeenListPage from './pages/SeenListPage';
import DailySummaryPage from './pages/DailySummaryPage';
import { authService } from './services/authService';
import { getInitialSelectedDate } from './utils/dateUtils';
import { realtimeService } from './services/realtimeService';
import { Radio, X, Bell } from 'lucide-react';
import './styles/index.css';
import './styles/layout.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [selectedDate, setSelectedDate] = useState(() => getInitialSelectedDate());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [liveToast, setLiveToast] = useState(null);

  // Auto-login fallback for immediate development review if needed, or prompt for login
  useEffect(() => {
    const sessionUser = authService.getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
  }, []);

  // Initialize Realtime Multi-User Sync & Presence
  useEffect(() => {
    if (!currentUser) return;

    realtimeService.init(currentUser, currentPage);

    // Subscribe to online users (presence)
    const unsubUsers = realtimeService.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });

    // Subscribe to real-time data modifications across all users on the web
    const unsubData = realtimeService.subscribeToDataChanges((change) => {
      // Refresh current active view data immediately
      setRefreshTrigger((prev) => prev + 1);
    });

    // Subscribe to toast announcements
    const unsubToasts = realtimeService.subscribeToToasts((toast) => {
      // Only show toast if change came from another user
      if (toast.userName && toast.userName !== currentUser.name) {
        setLiveToast(toast);
        setTimeout(() => {
          setLiveToast((current) => (current === toast ? null : current));
        }, 5000);
      }
    });

    return () => {
      unsubUsers();
      unsubData();
      unsubToasts();
    };
  }, [currentUser]);

  // Keep presence updated with the current screen the user is viewing
  useEffect(() => {
    if (currentUser) {
      realtimeService.updateCurrentPage(currentPage);
    }
  }, [currentPage, currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    realtimeService.cleanup();
    await authService.logout();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // If not logged in, render the professional login screen
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render current selected page inside the unified application layout
  return (
    <>
      {/* Live Data Sync Notification Toast */}
      {liveToast && (
        <div
          className="live-sync-toast"
          role="status"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="live-pulse-dot" />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#0f172a' }}>
                Live update from {liveToast.userName}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-subtle)' }}>
                {liveToast.summary || 'Production data was updated'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setLiveToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <AppLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefreshData={handleRefreshData}
        onlineUsers={onlineUsers}
        onRefreshPresence={() => realtimeService.handlePresenceSync()}
        key={`${selectedDate}_${refreshTrigger}`}
      >
      {currentPage === 'dashboard' && (
        <DashboardPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'daily-target' && (
        <DailyTargetPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'hourly-scanning' && (
        <HourlyScanningPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'batch-production' && (
        <BatchProductionPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'vehicle-loading' && (
        <VehicleLoadingPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'vehicle-unloading' && (
        <VehicleUnloadingPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'attendance' && (
        <AttendancePage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'seen-list' && (
        <SeenListPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'daily-summary' && (
        <DailySummaryPage
          selectedDate={selectedDate}
          currentUser={currentUser}
          onNavigate={setCurrentPage}
        />
      )}
    </AppLayout>
    </>
  );
}
