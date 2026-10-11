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
import './styles/index.css';
import './styles/layout.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [selectedDate, setSelectedDate] = useState(() => getInitialSelectedDate());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-login fallback for immediate development review if needed, or prompt for login
  useEffect(() => {
    const sessionUser = authService.getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
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
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      currentUser={currentUser}
      onLogout={handleLogout}
      onRefreshData={handleRefreshData}
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
  );
}
