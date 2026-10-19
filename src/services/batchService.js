/**
 * Batch Production Service
 * Connected to Supabase + Local Cache
 */

import { supabase } from '../supabase/config';
import { Storage } from '../utils/storage';
import { realtimeService } from './realtimeService';

export const batchService = {
  /**
   * Get all batch records for a specific date
   * @param {string} date - 'YYYY-MM-DD'
   * @returns {Promise<Array>}
   */
  async getBatchProduction(date) {
    let dateRecords = [];
    try {
      const { data, error } = await supabase
        .from('batch_production')
        .select('*')
        .eq('date', date);

      if (!error && data && data.length > 0) {
        dateRecords = data;
      }
    } catch (err) {
      console.warn('Supabase read error for batchProduction, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const allBatches = Storage.getBatchProduction();
      dateRecords = allBatches.filter((b) => b.date === date);
    }

    return dateRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Save a new batch entry or update existing in Supabase
   */
  async saveBatchProduction(payload) {
    const allBatches = Storage.getBatchProduction();
    const nowISO = new Date().toISOString();
    const username = payload.user?.username || 'system';
    const id = payload.id || `batch_${payload.date}_${Date.now()}`;

    const batchRecord = {
      id,
      date: payload.date,
      hour: payload.hour,
      batchQuantity: Number(payload.batchQuantity) || 0,
      remarks: payload.remarks || '',
      createdAt: payload.id ? (allBatches.find((b) => b.id === id)?.createdAt || nowISO) : nowISO,
      updatedAt: nowISO,
      createdBy: payload.id ? (allBatches.find((b) => b.id === id)?.createdBy || username) : username,
      updatedBy: username
    };

    if (payload.id) {
      const idx = allBatches.findIndex((b) => b.id === payload.id);
      if (idx >= 0) allBatches[idx] = batchRecord;
    } else {
      allBatches.unshift(batchRecord);
    }
    Storage.setBatchProduction(allBatches);

    // Save to Supabase
    try {
      await supabase.from('batch_production').upsert(batchRecord, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase batch save warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'batch_production',
      action: 'UPDATE',
      date: payload.date,
      userName: payload.user?.name || username,
      summary: `Batch added for slot ${payload.hour}: ${batchRecord.batchQuantity} Pcs`
    });

    return batchRecord;
  },

  /**
   * Delete a batch entry in Supabase
   */
  async deleteBatchProduction(id) {
    const allBatches = Storage.getBatchProduction();
    Storage.setBatchProduction(allBatches.filter((b) => b.id !== id));

    try {
      await supabase.from('batch_production').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase batch delete warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'batch_production',
      action: 'DELETE',
      summary: `Batch entry deleted`
    });

    return { success: true };
  }
};
