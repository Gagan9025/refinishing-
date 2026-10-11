import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Save,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Modal from '../components/Modal';
import { batchService } from '../services/batchService';
import { productionService } from '../services/productionService';
import { SHIFT_HOURS, formatDateDisplay } from '../utils/dateUtils';
import {
  calculateRemaining,
  calculateAchievementPercentage
} from '../utils/calculationUtils';

export default function BatchProductionPage({ selectedDate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formValues, setFormValues] = useState({
    hour: SHIFT_HOURS[0],
    batchQuantity: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isDataEntry = currentUser?.role === 'DATA ENTRY';

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchList, targetData] = await Promise.all([
        batchService.getBatchProduction(selectedDate),
        productionService.getDailyTarget(selectedDate)
      ]);
      setBatches(batchList);
      setDailyTarget(targetData);
    } catch (err) {
      console.error('Error loading batch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormValues({
      hour: SHIFT_HOURS[0],
      batchQuantity: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setFormValues({
      hour: batch.hour,
      batchQuantity: batch.batchQuantity,
      remarks: batch.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isDataEntry) return;
    if (window.confirm('Are you sure you want to delete this batch record?')) {
      try {
        await batchService.deleteBatchProduction(id);
        setMessage({ type: 'success', text: 'Batch record deleted successfully.' });
        loadData();
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to delete batch record.' });
      }
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!isDataEntry) return;

    if (!formValues.batchQuantity || Number(formValues.batchQuantity) <= 0) {
      alert('Please enter a valid batch quantity greater than 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingBatch ? editingBatch.id : undefined,
        date: selectedDate,
        hour: formValues.hour,
        batchQuantity: Number(formValues.batchQuantity),
        remarks: formValues.remarks,
        user: currentUser
      };

      await batchService.saveBatchProduction(payload);
      setIsModalOpen(false);
      setMessage({
        type: 'success',
        text: `Batch production entry for ${formValues.hour} saved successfully.`
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save batch entry.' });
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalBatchAchieved = batches.reduce((sum, b) => sum + (Number(b.batchQuantity) || 0), 0);
  const batchTarget = dailyTarget?.batchTarget || null;
  const batchRemaining = batchTarget ? calculateRemaining(batchTarget, totalBatchAchieved) : null;
  const batchPct = batchTarget ? calculateAchievementPercentage(batchTarget, totalBatchAchieved) : null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Layers size={24} style={{ color: 'var(--color-primary)' }} />
            <span>Batch Production Management</span>
          </h1>
          <p className="page-subtitle">
            Specialized Batch Runs • Shift Date: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          {isDataEntry && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAdd}
            >
              <Plus size={16} />
              Add Batch Output
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: message.type === 'success' ? '#15803d' : '#b91c1c'
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-title">Total Batch Production</span>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {totalBatchAchieved.toLocaleString()}
          </div>
          <span className="stat-meta">{batches.length} batch run(s) logged</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Batch Target</span>
          <div className="stat-value">
            {batchTarget !== null ? batchTarget.toLocaleString() : 'Not Set'}
          </div>
          <span className="stat-meta">From Daily Target</span>
        </div>

        {batchTarget !== null ? (
          <>
            <div className="stat-card">
              <span className="stat-title">Remaining Batch Quota</span>
              <div className="stat-value" style={{ color: batchRemaining > 0 ? '#b91c1c' : '#15803d' }}>
                {batchRemaining.toLocaleString()}
              </div>
              <span className="stat-meta">Target - Achieved</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Batch Achievement %</span>
              <div className="stat-value">{batchPct}%</div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${batchPct >= 100 ? 'green' : batchPct >= 80 ? 'blue' : 'amber'}`}
                  style={{ width: `${Math.min(100, Number(batchPct))}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <span className="stat-title">Target Status</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              No batch target configured for {formatDateDisplay(selectedDate)}. You can configure one in Daily Target.
            </div>
          </div>
        )}
      </div>

      {/* Table of Batch Production Records */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Layers size={18} style={{ color: 'var(--color-primary)' }} />
            Logged Batch Production Entries
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
            Total entries: {batches.length}
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Hour Slot</th>
                <th className="num-cell" style={{ width: '140px' }}>Batch Quantity</th>
                <th>Remarks / Batch Code</th>
                <th style={{ width: '140px' }}>Created By</th>
                <th style={{ width: '130px' }}>Timestamp</th>
                {isDataEntry && <th style={{ textAlign: 'center', width: '110px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {batches.length > 0 ? (
                batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                        {batch.hour}
                      </div>
                    </td>
                    <td className="num-cell" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                      {batch.batchQuantity.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ color: batch.remarks ? 'var(--color-text-main)' : 'var(--color-text-subtle)' }}>
                        {batch.remarks || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {batch.createdBy}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                      {new Date(batch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {isDataEntry && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 6px' }}
                            onClick={() => handleOpenEdit(batch)}
                            title="Edit batch entry"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 6px', color: '#dc2626' }}
                            onClick={() => handleDelete(batch.id)}
                            title="Delete batch entry"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isDataEntry ? 6 : 5} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--color-text-subtle)' }}>
                      No batch production records found for {formatDateDisplay(selectedDate)}.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {batches.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: '700', borderTop: '2px solid var(--color-border)' }}>
                  <td>TOTAL BATCH</td>
                  <td className="num-cell" style={{ color: 'var(--color-primary)' }}>
                    {totalBatchAchieved.toLocaleString()}
                  </td>
                  <td colSpan={isDataEntry ? 4 : 3} style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                    Combined total of all recorded batches
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Batch Entry */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBatch ? 'Edit Batch Production Record' : 'Record New Batch Output'}
        >
          <form onSubmit={handleSaveBatch}>
            <div className="form-group">
              <label className="form-label" htmlFor="batch-hour">Hour Period *</label>
              <select
                id="batch-hour"
                className="form-control"
                value={formValues.hour}
                onChange={(e) => setFormValues({ ...formValues, hour: e.target.value })}
                required
              >
                {SHIFT_HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="batch-qty">Batch Quantity (Pcs) *</label>
              <input
                id="batch-qty"
                type="number"
                min="1"
                step="1"
                className="form-control"
                placeholder="e.g. 120"
                value={formValues.batchQuantity}
                onChange={(e) => setFormValues({ ...formValues, batchQuantity: e.target.value })}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="batch-remarks">Remarks / Batch Number</label>
              <textarea
                id="batch-remarks"
                rows={3}
                className="form-control"
                placeholder="e.g. Batch #B-901 Satin Black finish, special QA lot"
                value={formValues.remarks}
                onChange={(e) => setFormValues({ ...formValues, remarks: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : editingBatch ? 'Update Batch' : 'Save Batch'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
