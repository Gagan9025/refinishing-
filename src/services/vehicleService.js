/**
 * Vehicle Service (Vehicle Loading & Vehicle Unloading)
 * Connected to Supabase + Local Cache
 */

import { supabase } from '../supabase/config';
import { Storage } from '../utils/storage';
import { realtimeService } from './realtimeService';

export const vehicleService = {
  // ==========================================
  // VEHICLE UNLOADING (INCOMING / INWARD)
  // ==========================================

  async getVehicleUnloading(date) {
    let dateRecords = [];
    try {
      const { data, error } = await supabase
        .from('vehicle_unloading')
        .select('*')
        .eq('date', date);

      if (!error && data && data.length > 0) {
        dateRecords = data;
      }
    } catch (err) {
      console.warn('Supabase read error for vehicleUnloading, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const all = Storage.getVehicleUnloading();
      dateRecords = all.filter((v) => v.date === date);
    }

    return dateRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveVehicleUnloading(payload) {
    const all = Storage.getVehicleUnloading();
    const nowISO = new Date().toISOString();
    const username = payload.user?.username || 'system';
    const id = payload.id || `unloading_${payload.date}_${Date.now()}`;

    const existing = payload.id ? all.find((v) => v.id === id) : null;
    const record = {
      id,
      date: payload.date,
      time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vehicleNumber: (payload.vehicleNumber || '').trim().toUpperCase(),
      driverName: (payload.driverName || '').trim(),
      boxes: Number(payload.boxes) || 0,
      quantity: Number(payload.quantity) || 0,
      source: payload.source || '',
      remarks: payload.remarks || '',
      createdAt: existing ? existing.createdAt : nowISO,
      updatedAt: nowISO,
      createdBy: existing ? existing.createdBy : username,
      updatedBy: username
    };

    if (payload.id) {
      const idx = all.findIndex((v) => v.id === payload.id);
      if (idx >= 0) all[idx] = record;
    } else {
      all.unshift(record);
    }
    Storage.setVehicleUnloading(all);

    try {
      await supabase.from('vehicle_unloading').upsert(record, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase vehicleUnloading save warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'vehicle_unloading',
      action: 'UPDATE',
      date: payload.date,
      userName: payload.user?.name || username,
      summary: `Vehicle Unloaded: ${record.vehicleNumber} (${record.quantity} Pcs)`
    });

    return record;
  },

  async deleteVehicleUnloading(id) {
    const all = Storage.getVehicleUnloading();
    Storage.setVehicleUnloading(all.filter((v) => v.id !== id));

    try {
      await supabase.from('vehicle_unloading').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase vehicleUnloading delete warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'vehicle_unloading',
      action: 'DELETE',
      summary: `Vehicle unloading record removed`
    });

    return { success: true };
  },

  // ==========================================
  // VEHICLE LOADING (OUTGOING / DISPATCH)
  // ==========================================

  async getVehicleLoading(date) {
    let dateRecords = [];
    try {
      const { data, error } = await supabase
        .from('vehicle_loading')
        .select('*')
        .eq('date', date);

      if (!error && data && data.length > 0) {
        dateRecords = data;
      }
    } catch (err) {
      console.warn('Supabase read error for vehicleLoading, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const all = Storage.getVehicleLoading();
      dateRecords = all.filter((v) => v.date === date);
    }

    return dateRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveVehicleLoading(payload) {
    const all = Storage.getVehicleLoading();
    const nowISO = new Date().toISOString();
    const username = payload.user?.username || 'system';
    const id = payload.id || `loading_${payload.date}_${Date.now()}`;

    const existing = payload.id ? all.find((v) => v.id === id) : null;
    const record = {
      id,
      date: payload.date,
      time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vehicleNumber: (payload.vehicleNumber || '').trim().toUpperCase(),
      driverName: (payload.driverName || '').trim(),
      boxes: Number(payload.boxes) || 0,
      quantity: Number(payload.quantity) || 0,
      destination: payload.destination || '',
      remarks: payload.remarks || '',
      createdAt: existing ? existing.createdAt : nowISO,
      updatedAt: nowISO,
      createdBy: existing ? existing.createdBy : username,
      updatedBy: username
    };

    if (payload.id) {
      const idx = all.findIndex((v) => v.id === payload.id);
      if (idx >= 0) all[idx] = record;
    } else {
      all.unshift(record);
    }
    Storage.setVehicleLoading(all);

    try {
      await supabase.from('vehicle_loading').upsert(record, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase vehicleLoading save warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'vehicle_loading',
      action: 'UPDATE',
      date: payload.date,
      userName: payload.user?.name || username,
      summary: `Vehicle Loaded: ${record.vehicleNumber} (${record.quantity} Pcs dispatched)`
    });

    return record;
  },

  async deleteVehicleLoading(id) {
    const all = Storage.getVehicleLoading();
    Storage.setVehicleLoading(all.filter((v) => v.id !== id));

    try {
      await supabase.from('vehicle_loading').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase vehicleLoading delete warning:', err.message);
    }

    // Broadcast live update
    realtimeService.notifyDataChange({
      table: 'vehicle_loading',
      action: 'DELETE',
      summary: `Vehicle loading record removed`
    });

    return { success: true };
  }
};
