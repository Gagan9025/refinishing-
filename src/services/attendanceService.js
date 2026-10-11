/**
 * Daily Attendance Service
 * Connected to Cloud Firestore + Local Cache
 */

import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Storage } from '../utils/storage';
import { INITIAL_EMPLOYEES } from '../data/mockData';

export const attendanceService = {
  async getAttendance(date) {
    let dateRecords = [];
    try {
      const q = query(collection(db, 'attendance'), where('date', '==', date));
      const snap = await getDocs(q);
      if (!snap.empty) {
        dateRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore read error for attendance, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const allAttendance = Storage.getAttendance();
      dateRecords = allAttendance.filter((a) => a.date === date);

      // Seed default roster if empty
      if (dateRecords.length === 0) {
        const nowISO = new Date().toISOString();
        dateRecords = INITIAL_EMPLOYEES.map((emp) => ({
          id: `att_${date}_${emp.id}`,
          date,
          employeeId: emp.id,
          employeeName: emp.name,
          status: 'Present',
          createdAt: nowISO,
          updatedAt: nowISO,
          createdBy: 'system',
          updatedBy: 'system'
        }));
        Storage.setAttendance([...allAttendance, ...dateRecords]);
      }
    }

    return dateRecords.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  },

  async saveAttendance(payload) {
    const allAttendance = Storage.getAttendance();
    const idx = allAttendance.findIndex(
      (a) => a.date === payload.date && a.employeeId === payload.employeeId
    );
    const nowISO = new Date().toISOString();
    const username = payload.user?.username || 'system';
    const id = `att_${payload.date}_${payload.employeeId}`;

    let updatedRecord;
    if (idx >= 0) {
      updatedRecord = {
        ...allAttendance[idx],
        employeeName: payload.employeeName || allAttendance[idx].employeeName,
        status: payload.status,
        updatedAt: nowISO,
        updatedBy: username
      };
      allAttendance[idx] = updatedRecord;
    } else {
      updatedRecord = {
        id,
        date: payload.date,
        employeeId: payload.employeeId,
        employeeName: payload.employeeName || '',
        status: payload.status,
        createdAt: nowISO,
        updatedAt: nowISO,
        createdBy: username,
        updatedBy: username
      };
      allAttendance.push(updatedRecord);
    }
    Storage.setAttendance(allAttendance);

    try {
      await setDoc(doc(db, 'attendance', id), updatedRecord, { merge: true });
    } catch (err) {
      console.warn('Firestore attendance save warning:', err.message);
    }

    return updatedRecord;
  },

  async addEmployee(date, employeeId, employeeName, status = 'Present', user) {
    const allAttendance = Storage.getAttendance();
    const nowISO = new Date().toISOString();
    const username = user?.username || 'system';
    const id = `att_${date}_${employeeId}`;

    const newRec = {
      id,
      date,
      employeeId,
      employeeName,
      status,
      createdAt: nowISO,
      updatedAt: nowISO,
      createdBy: username,
      updatedBy: username
    };

    allAttendance.push(newRec);
    Storage.setAttendance(allAttendance);

    try {
      await setDoc(doc(db, 'attendance', id), newRec, { merge: true });
    } catch (err) {
      console.warn('Firestore add employee warning:', err.message);
    }

    return newRec;
  },

  async bulkUpdateStatus(date, status, user) {
    const allAttendance = Storage.getAttendance();
    const nowISO = new Date().toISOString();
    const username = user?.username || 'system';

    const updated = allAttendance.map((rec) => {
      if (rec.date === date) {
        const item = {
          ...rec,
          status,
          updatedAt: nowISO,
          updatedBy: username
        };
        // Background firestore sync
        try {
          setDoc(doc(db, 'attendance', item.id), item, { merge: true });
        } catch (e) {}
        return item;
      }
      return rec;
    });

    Storage.setAttendance(updated);
    return updated.filter((r) => r.date === date);
  }
};
