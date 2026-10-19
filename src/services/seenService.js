import { supabase } from '../supabase/config';
import { Storage } from '../utils/storage';
import { realtimeService } from './realtimeService';

export const seenService = {
  /**
   * Get all seen records for a specific date
   * @param {string} date - 'YYYY-MM-DD'
   * @returns {Promise<Array>}
   */
  async getSeenRecords(date) {
    let dateRecords = [];
    try {
      const { data, error } = await supabase
        .from('seen_records')
        .select('*')
        .eq('date', date);

      if (!error && data && data.length > 0) {
        dateRecords = data;
      }
    } catch (err) {
      console.warn('Supabase read error for seenRecords, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const allSeen = Storage.getSeenRecords();
      dateRecords = allSeen.filter((s) => s.date === date);
    }

    return dateRecords.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
  },

  /**
   * Get seen count and list for a specific hour on a date
   */
  async getSeenForHour(date, hour) {
    const records = await this.getSeenRecords(date);
    return records.filter((s) => s.hour === hour);
  },

  /**
   * Record a viewer access entry
   * @param {object} payload - { viewerId, viewerName, date, module, hour }
   * @returns {Promise<object>}
   */
  async saveSeenRecord(payload) {
    const allSeen = Storage.getSeenRecords();
    const nowISO = new Date().toISOString();

    // Avoid duplicate records within the same 5-minute window for the same user and hour
    const recentDuplicate = allSeen.find((s) => {
      if (s.viewerId === payload.viewerId && s.date === payload.date && s.hour === payload.hour) {
        const timeDiff = Math.abs(new Date(nowISO) - new Date(s.viewedAt));
        return timeDiff < 5 * 60 * 1000; // 5 mins
      }
      return false;
    });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const recordId = `seen_${payload.date}_${(payload.hour || '').replace(/[^a-zA-Z0-9]/g, '_')}_${payload.viewerId || 'anon'}_${Date.now()}`;
    const newRecord = {
      id: recordId,
      viewerId: payload.viewerId || 'V_ANON',
      viewerName: payload.viewerName || 'Viewer',
      date: payload.date,
      module: payload.module || 'Hourly Scanning',
      hour: payload.hour,
      viewedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
      createdBy: payload.viewerId || 'viewer',
      updatedBy: payload.viewerId || 'viewer'
    };

    allSeen.unshift(newRecord);
    Storage.setSeenRecords(allSeen);

    try {
      await supabase.from('seen_records').insert(newRecord);
    } catch (err) {
      console.warn('Supabase seenRecord save warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'seen_records',
      action: 'INSERT',
      date: payload.date,
      userName: payload.viewerName,
      summary: `Viewed & Verified: ${payload.viewerName} checked ${payload.module || 'Data'} (${payload.hour || ''})`
    });

    return newRecord;
  }
};
