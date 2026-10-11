/**
 * Production Service (Daily Target & Hourly Scanning)
 * Connected to Cloud Firestore + Local Cache Fallback
 */

import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Storage } from '../utils/storage';
import { SHIFT_HOURS } from '../utils/dateUtils';
import {
  calculateDifference,
  calculateAchievementPercentage,
  calculateProductionStatus
} from '../utils/calculationUtils';

export const productionService = {
  /**
   * Get Daily Target for a specific date from Firestore
   * @param {string} date - 'YYYY-MM-DD'
   * @returns {Promise<object|null>}
   */
  async getDailyTarget(date) {
    try {
      const docRef = doc(db, 'dailyTargets', `target_${date}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return { id: snap.id, ...data };
      }
    } catch (err) {
      console.warn('Firestore read error for dailyTargets, using local cache:', err.message);
    }
    // Fallback to local storage
    const targets = Storage.getDailyTargets();
    const found = targets.find((t) => t.date === date);
    return found ? { ...found } : null;
  },

  /**
   * Save / Update Daily Target for a date in Firestore
   * @param {object} data - { date, scanningTarget, batchTarget, user }
   * @returns {Promise<object>}
   */
  async saveDailyTarget(data) {
    const targets = Storage.getDailyTargets();
    const existingIndex = targets.findIndex((t) => t.date === data.date);
    const nowISO = new Date().toISOString();
    const username = data.user?.username || 'system';

    const targetPayload = {
      id: existingIndex >= 0 ? targets[existingIndex].id : `target_${data.date}`,
      date: data.date,
      scanningTarget: Number(data.scanningTarget) || 0,
      batchTarget: data.batchTarget !== undefined && data.batchTarget !== '' ? Number(data.batchTarget) : null,
      createdAt: existingIndex >= 0 ? targets[existingIndex].createdAt : nowISO,
      updatedAt: nowISO,
      createdBy: existingIndex >= 0 ? targets[existingIndex].createdBy : username,
      updatedBy: username
    };

    // Update local cache
    if (existingIndex >= 0) {
      targets[existingIndex] = targetPayload;
    } else {
      targets.push(targetPayload);
    }
    Storage.setDailyTargets(targets);

    // Save to live Cloud Firestore
    try {
      const docRef = doc(db, 'dailyTargets', `target_${data.date}`);
      await setDoc(docRef, targetPayload, { merge: true });
    } catch (err) {
      console.warn('Firestore write warning (check Security Rules if permission denied):', err.message);
    }

    return targetPayload;
  },

  /**
   * Get Hourly Production list for a specific date (all 8 shift slots)
   * @param {string} date - 'YYYY-MM-DD'
   * @returns {Promise<Array>}
   */
  async getHourlyProduction(date) {
    let dateRecords = [];

    try {
      const q = query(collection(db, 'hourlyProduction'), where('date', '==', date));
      const snap = await getDocs(q);
      if (!snap.empty) {
        dateRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore read error for hourlyProduction, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const allRecords = Storage.getHourlyProduction();
      dateRecords = allRecords.filter((r) => r.date === date);
    }

    const dailyTarget = await this.getDailyTarget(date);
    const defaultHourlyTarget = dailyTarget?.scanningTarget
      ? Math.round(Number(dailyTarget.scanningTarget) / 8)
      : 125;

    // Ensure all 8 shift hour slots are represented for complete display
    const mappedSlots = SHIFT_HOURS.map((hour, idx) => {
      const match = dateRecords.find((r) => r.hour === hour);
      if (match) {
        return { ...match };
      }
      return {
        id: `hp_${date}_slot_${idx + 1}`,
        date,
        hour,
        target: defaultHourlyTarget,
        achieved: 0,
        difference: 0,
        achievementPercentage: 0,
        status: 'Not Updated',
        remarks: '',
        isUpdated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system'
      };
    });

    return mappedSlots;
  },

  /**
   * Save / Update an Hourly Production slot in Firestore
   * @param {object} payload - { date, hour, target, achieved, remarks, user }
   * @returns {Promise<object>}
   */
  async saveHourlyProduction(payload) {
    const allRecords = Storage.getHourlyProduction();
    const existingIndex = allRecords.findIndex(
      (r) => r.date === payload.date && r.hour === payload.hour
    );

    const target = Number(payload.target) || 0;
    const achieved = Number(payload.achieved) || 0;
    const difference = calculateDifference(target, achieved);
    const achievementPercentage = calculateAchievementPercentage(target, achieved);
    const status = calculateProductionStatus(target, achieved, true);

    const nowISO = new Date().toISOString();
    const username = payload.user?.username || 'system';
    const slotIdx = SHIFT_HOURS.indexOf(payload.hour) + 1;
    const recordId = existingIndex >= 0 ? allRecords[existingIndex].id : `hp_${payload.date}_slot_${slotIdx || Date.now()}`;

    const updatedRecord = {
      id: recordId,
      date: payload.date,
      hour: payload.hour,
      target,
      achieved,
      difference,
      achievementPercentage,
      status,
      remarks: payload.remarks || '',
      isUpdated: true,
      createdAt: existingIndex >= 0 ? allRecords[existingIndex].createdAt : nowISO,
      updatedAt: nowISO,
      createdBy: existingIndex >= 0 ? allRecords[existingIndex].createdBy : username,
      updatedBy: username
    };

    // Save to local cache
    if (existingIndex >= 0) {
      allRecords[existingIndex] = updatedRecord;
    } else {
      allRecords.push(updatedRecord);
    }
    Storage.setHourlyProduction(allRecords);

    // Save to live Cloud Firestore
    try {
      const docRef = doc(db, 'hourlyProduction', recordId);
      await setDoc(docRef, updatedRecord, { merge: true });
    } catch (err) {
      console.warn('Firestore write warning:', err.message);
    }

    return updatedRecord;
  },

  /**
   * Distribute daily scanning target across hourly slots to achieve the target.
   */
  async distributeDailyTargetAcrossHours(date, dailyScanningTarget, mode = 'all', user = null) {
    const totalTarget = Number(dailyScanningTarget) || 0;
    const username = user?.username || 'system';
    const nowISO = new Date().toISOString();

    let allRecords = Storage.getHourlyProduction();

    // Ensure 8 slots exist
    SHIFT_HOURS.forEach((hour, idx) => {
      const matchIndex = allRecords.findIndex((r) => r.date === date && r.hour === hour);
      if (matchIndex < 0) {
        allRecords.push({
          id: `hp_${date}_slot_${idx + 1}`,
          date,
          hour,
          target: Math.round(totalTarget / 8),
          achieved: 0,
          difference: 0,
          achievementPercentage: 0,
          status: 'Not Updated',
          remarks: '',
          isUpdated: false,
          createdAt: nowISO,
          updatedAt: nowISO,
          createdBy: username,
          updatedBy: username
        });
      }
    });

    if (mode === 'all') {
      const baseHourly = Math.floor(totalTarget / 8);
      const remainder = totalTarget % 8;

      allRecords = allRecords.map((r) => {
        if (r.date !== date) return r;
        const slotIdx = SHIFT_HOURS.indexOf(r.hour);
        const allocatedTarget = baseHourly + (slotIdx < remainder ? 1 : 0);
        
        const diff = r.isUpdated ? calculateDifference(allocatedTarget, r.achieved) : 0;
        const pct = r.isUpdated ? calculateAchievementPercentage(allocatedTarget, r.achieved) : 0;
        const stat = calculateProductionStatus(allocatedTarget, r.achieved, r.isUpdated);

        return {
          ...r,
          target: allocatedTarget,
          difference: diff,
          achievementPercentage: pct,
          status: stat,
          updatedAt: nowISO,
          updatedBy: username
        };
      });
    } else if (mode === 'adaptive') {
      const loggedRecords = allRecords.filter((r) => r.date === date && r.isUpdated);
      const unloggedRecords = allRecords.filter((r) => r.date === date && !r.isUpdated);

      const achievedSoFar = loggedRecords.reduce((sum, r) => sum + (Number(r.achieved) || 0), 0);
      const remainingTargetToAchieve = Math.max(0, totalTarget - achievedSoFar);
      const remainingSlotsCount = unloggedRecords.length;

      if (remainingSlotsCount > 0) {
        const baseForRemaining = Math.floor(remainingTargetToAchieve / remainingSlotsCount);
        const remainderForRemaining = remainingTargetToAchieve % remainingSlotsCount;

        let unloggedCounter = 0;
        allRecords = allRecords.map((r) => {
          if (r.date !== date) return r;
          if (r.isUpdated) return r;

          const allocatedTarget = baseForRemaining + (unloggedCounter < remainderForRemaining ? 1 : 0);
          unloggedCounter++;

          return {
            ...r,
            target: allocatedTarget,
            difference: 0,
            achievementPercentage: 0,
            status: 'Not Updated',
            updatedAt: nowISO,
            updatedBy: username
          };
        });
      }
    }

    Storage.setHourlyProduction(allRecords);

    // Batch update to live Cloud Firestore
    const dateSlots = allRecords.filter((r) => r.date === date);
    for (const slot of dateSlots) {
      try {
        const docRef = doc(db, 'hourlyProduction', slot.id);
        await setDoc(docRef, slot, { merge: true });
      } catch (err) {
        // Continue silently if offline
      }
    }

    return dateSlots;
  },

  async initializeShiftHours(date, dailyScanningTarget, user, mode = 'all') {
    return this.distributeDailyTargetAcrossHours(date, dailyScanningTarget, mode, user);
  }
};
