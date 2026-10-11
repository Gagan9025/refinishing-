/**
 * Vehicle Service (Vehicle Loading & Vehicle Unloading)
 * Connected to Cloud Firestore + Local Cache
 */

import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Storage } from '../utils/storage';

export const vehicleService = {
  // ==========================================
  // VEHICLE UNLOADING (INCOMING / INWARD)
  // ==========================================

  async getVehicleUnloading(date) {
    let dateRecords = [];
    try {
      const q = query(collection(db, 'vehicleUnloading'), where('date', '==', date));
      const snap = await getDocs(q);
      if (!snap.empty) {
        dateRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore read error for vehicleUnloading, using local cache:', err.message);
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
      await setDoc(doc(db, 'vehicleUnloading', id), record, { merge: true });
    } catch (err) {
      console.warn('Firestore vehicleUnloading save warning:', err.message);
    }

    return record;
  },

  async deleteVehicleUnloading(id) {
    const all = Storage.getVehicleUnloading();
    const filtered = all.filter((v) => v.id !== id);
    Storage.setVehicleUnloading(filtered);

    try {
      await deleteDoc(doc(db, 'vehicleUnloading', id));
    } catch (err) {
      console.warn('Firestore vehicleUnloading delete warning:', err.message);
    }

    return { success: true };
  },

  // ==========================================
  // VEHICLE LOADING (OUTGOING / DISPATCH)
  // ==========================================

  async getVehicleLoading(date) {
    let dateRecords = [];
    try {
      const q = query(collection(db, 'vehicleLoading'), where('date', '==', date));
      const snap = await getDocs(q);
      if (!snap.empty) {
        dateRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore read error for vehicleLoading, using local cache:', err.message);
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
      await setDoc(doc(db, 'vehicleLoading', id), record, { merge: true });
    } catch (err) {
      console.warn('Firestore vehicleLoading save warning:', err.message);
    }

    return record;
  },

  async deleteVehicleLoading(id) {
    const all = Storage.getVehicleLoading();
    const filtered = all.filter((v) => v.id !== id);
    Storage.setVehicleLoading(filtered);

    try {
      await deleteDoc(doc(db, 'vehicleLoading', id));
    } catch (err) {
      console.warn('Firestore vehicleLoading delete warning:', err.message);
    }

    return { success: true };
  }
};
