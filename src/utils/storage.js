/**
 * Local Storage Adapter for Stage 1 Mock Data Persistence
 * 
 * In Stage 2, this layer is replaced by direct Firebase Firestore calls.
 */

import {
  INITIAL_USERS,
  INITIAL_DAILY_TARGETS,
  INITIAL_HOURLY_PRODUCTION,
  INITIAL_BATCH_PRODUCTION,
  INITIAL_VEHICLE_UNLOADING,
  INITIAL_VEHICLE_LOADING,
  INITIAL_ATTENDANCE,
  INITIAL_SEEN_RECORDS
} from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'refinishing_auth_user',
  DAILY_TARGETS: 'refinishing_daily_targets',
  HOURLY_PRODUCTION: 'refinishing_hourly_production',
  BATCH_PRODUCTION: 'refinishing_batch_production',
  VEHICLE_UNLOADING: 'refinishing_vehicle_unloading',
  VEHICLE_LOADING: 'refinishing_vehicle_loading',
  ATTENDANCE: 'refinishing_attendance',
  SEEN_RECORDS: 'refinishing_seen_records'
};

function getStorageItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving localStorage key "${key}":`, err);
  }
}

export const Storage = {
  // Current user session
  getCurrentUser() {
    return getStorageItem(STORAGE_KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user) {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  },
  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Daily Targets
  getDailyTargets() {
    return getStorageItem(STORAGE_KEYS.DAILY_TARGETS, INITIAL_DAILY_TARGETS);
  },
  setDailyTargets(data) {
    setStorageItem(STORAGE_KEYS.DAILY_TARGETS, data);
  },

  // Hourly Production
  getHourlyProduction() {
    return getStorageItem(STORAGE_KEYS.HOURLY_PRODUCTION, INITIAL_HOURLY_PRODUCTION);
  },
  setHourlyProduction(data) {
    setStorageItem(STORAGE_KEYS.HOURLY_PRODUCTION, data);
  },

  // Batch Production
  getBatchProduction() {
    return getStorageItem(STORAGE_KEYS.BATCH_PRODUCTION, INITIAL_BATCH_PRODUCTION);
  },
  setBatchProduction(data) {
    setStorageItem(STORAGE_KEYS.BATCH_PRODUCTION, data);
  },

  // Vehicle Unloading (Inward)
  getVehicleUnloading() {
    return getStorageItem(STORAGE_KEYS.VEHICLE_UNLOADING, INITIAL_VEHICLE_UNLOADING);
  },
  setVehicleUnloading(data) {
    setStorageItem(STORAGE_KEYS.VEHICLE_UNLOADING, data);
  },

  // Vehicle Loading (Outward)
  getVehicleLoading() {
    return getStorageItem(STORAGE_KEYS.VEHICLE_LOADING, INITIAL_VEHICLE_LOADING);
  },
  setVehicleLoading(data) {
    setStorageItem(STORAGE_KEYS.VEHICLE_LOADING, data);
  },

  // Attendance
  getAttendance() {
    return getStorageItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },
  setAttendance(data) {
    setStorageItem(STORAGE_KEYS.ATTENDANCE, data);
  },

  // Seen Records
  getSeenRecords() {
    return getStorageItem(STORAGE_KEYS.SEEN_RECORDS, INITIAL_SEEN_RECORDS);
  },
  setSeenRecords(data) {
    setStorageItem(STORAGE_KEYS.SEEN_RECORDS, data);
  },

  // Hard Reset to Mock Data
  resetToMockData() {
    localStorage.removeItem(STORAGE_KEYS.DAILY_TARGETS);
    localStorage.removeItem(STORAGE_KEYS.HOURLY_PRODUCTION);
    localStorage.removeItem(STORAGE_KEYS.BATCH_PRODUCTION);
    localStorage.removeItem(STORAGE_KEYS.VEHICLE_UNLOADING);
    localStorage.removeItem(STORAGE_KEYS.VEHICLE_LOADING);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SEEN_RECORDS);
    // Re-initialize
    setStorageItem(STORAGE_KEYS.DAILY_TARGETS, INITIAL_DAILY_TARGETS);
    setStorageItem(STORAGE_KEYS.HOURLY_PRODUCTION, INITIAL_HOURLY_PRODUCTION);
    setStorageItem(STORAGE_KEYS.BATCH_PRODUCTION, INITIAL_BATCH_PRODUCTION);
    setStorageItem(STORAGE_KEYS.VEHICLE_UNLOADING, INITIAL_VEHICLE_UNLOADING);
    setStorageItem(STORAGE_KEYS.VEHICLE_LOADING, INITIAL_VEHICLE_LOADING);
    setStorageItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    setStorageItem(STORAGE_KEYS.SEEN_RECORDS, INITIAL_SEEN_RECORDS);
  }
};
