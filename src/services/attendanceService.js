/**
 * Daily Attendance Service
 * Connected to Supabase + Local Cache
 */

import { supabase } from '../supabase/config';
import { Storage } from '../utils/storage';
import { INITIAL_EMPLOYEES } from '../data/mockData';
import { realtimeService } from './realtimeService';

export const attendanceService = {
  async getAttendance(date) {
    let dateRecords = [];
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);

      if (!error && data && data.length > 0) {
        dateRecords = data;
      }
    } catch (err) {
      console.warn('Supabase read error for attendance, using local cache:', err.message);
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
      await supabase.from('attendance').upsert(updatedRecord, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase attendance save warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'attendance',
      action: 'UPDATE',
      date: payload.date,
      userName: payload.user?.name || username,
      summary: `Attendance: ${updatedRecord.employeeName} marked ${updatedRecord.status}`
    });

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
      await supabase.from('attendance').upsert(newRec, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase add employee warning:', err.message);
    }

    return newRec;
  },

  async bulkUpdateStatus(date, status, user) {
    const allAttendance = Storage.getAttendance();
    const nowISO = new Date().toISOString();
    const username = user?.username || 'system';

    const updated = allAttendance.map((rec) => {
      if (rec.date === date) {
        return { ...rec, status, updatedAt: nowISO, updatedBy: username };
      }
      return rec;
    });

    Storage.setAttendance(updated);

    // Batch upsert to Supabase
    const toSync = updated.filter((r) => r.date === date);
    try {
      await supabase.from('attendance').upsert(toSync, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase bulk attendance warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'attendance',
      action: 'UPDATE',
      date,
      userName: user?.name || username,
      summary: `Bulk attendance updated for ${date} (${status})`
    });

    return toSync;
  }
};
