/**
 * Batch Production Service
 * Connected to Cloud Firestore + Local Cache
 */

import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Storage } from '../utils/storage';

export const batchService = {
  /**
   * Get all batch records for a specific date
   * @param {string} date - 'YYYY-MM-DD'
   * @returns {Promise<Array>}
   */
  async getBatchProduction(date) {
    let dateRecords = [];
    try {
      const q = query(collection(db, 'batchProduction'), where('date', '==', date));
      const snap = await getDocs(q);
      if (!snap.empty) {
        dateRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore read error for batchProduction, using local cache:', err.message);
    }

    if (dateRecords.length === 0) {
      const allBatches = Storage.getBatchProduction();
      dateRecords = allBatches.filter((b) => b.date === date);
    }

    return dateRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Save a new batch entry or update existing in Firestore
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

    // Save to Cloud Firestore
    try {
      const docRef = doc(db, 'batchProduction', id);
      await setDoc(docRef, batchRecord, { merge: true });
    } catch (err) {
      console.warn('Firestore batch save warning:', err.message);
    }

    return batchRecord;
  },

  /**
   * Delete a batch entry in Firestore
   */
  async deleteBatchProduction(id) {
    const allBatches = Storage.getBatchProduction();
    const filtered = allBatches.filter((b) => b.id !== id);
    Storage.setBatchProduction(filtered);

    try {
      await deleteDoc(doc(db, 'batchProduction', id));
    } catch (err) {
      console.warn('Firestore batch delete warning:', err.message);
    }

    return { success: true };
  }
};
