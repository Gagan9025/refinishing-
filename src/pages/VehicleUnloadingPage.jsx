import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Save,
  Trash2,
  Edit2,
  Truck,
  Package,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import { vehicleService } from '../services/vehicleService';
import { formatDateDisplay } from '../utils/dateUtils';

export default function VehicleUnloadingPage({ selectedDate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formValues, setFormValues] = useState({
    time: '',
    vehicleNumber: '',
    driverName: '',
    boxes: '',
    quantity: '',
    source: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isDataEntry = currentUser?.role === 'DATA ENTRY';

  useEffect(() => {
    loadRecords();
  }, [selectedDate]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehicleUnloading(selectedDate);
      setRecords(data);
    } catch (err) {
      console.error('Error loading unloading records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormValues({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vehicleNumber: '',
      driverName: '',
      boxes: '',
      quantity: '',
      source: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setFormValues({
      time: rec.time,
      vehicleNumber: rec.vehicleNumber,
      driverName: rec.driverName || '',
      boxes: rec.boxes,
      quantity: rec.quantity,
      source: rec.source || '',
      remarks: rec.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isDataEntry) return;
    if (window.confirm('Are you sure you want to delete this vehicle unloading entry?')) {
      try {
        await vehicleService.deleteVehicleUnloading(id);
        setMessage({ type: 'success', text: 'Unloading entry deleted successfully.' });
        loadRecords();
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to delete record.' });
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isDataEntry) return;

    if (!formValues.vehicleNumber.trim()) {
      alert('Vehicle Number is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingRecord ? editingRecord.id : undefined,
        date: selectedDate,
        time: formValues.time,
        vehicleNumber: formValues.vehicleNumber,
        driverName: formValues.driverName,
        boxes: Number(formValues.boxes) || 0,
        quantity: Number(formValues.quantity) || 0,
        source: formValues.source,
        remarks: formValues.remarks,
        user: currentUser
      };

      await vehicleService.saveVehicleUnloading(payload);
      setIsModalOpen(false);
      setMessage({
        type: 'success',
        text: `Inward vehicle ${formValues.vehicleNumber.toUpperCase()} recorded successfully.`
      });
      loadRecords();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save unloading record.' });
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalVehicles = records.length;
  const totalBoxes = records.reduce((sum, r) => sum + (Number(r.boxes) || 0), 0);
  const totalQuantity = records.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <ArrowDownToLine size={24} style={{ color: '#0284c7' }} />
            <span>Vehicle Unloading (Inward / Incoming Materials)</span>
          </h1>
          <p className="page-subtitle">
            Gate Entry & Raw Material Receipt • Date: <strong>{formatDateDisplay(selectedDate)}</strong>
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
              Record Inward Vehicle
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

      {/* KPI Cards: Inward Totals */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-title">Inward Vehicles</span>
          <div className="stat-value" style={{ color: '#0284c7' }}>{totalVehicles}</div>
          <span className="stat-meta">Arrived & unloaded today</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total Boxes</span>
          <div className="stat-value">{totalBoxes.toLocaleString()}</div>
          <span className="stat-meta">Material cartons received</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total Quantity</span>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {totalQuantity.toLocaleString()}
          </div>
          <span className="stat-meta">Individual panel/part count</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Material Status</span>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Inward verification active. Note: Vehicle volumes do not count toward hourly production achievement.
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Truck size={18} style={{ color: '#0284c7' }} />
            Today's Incoming Unloading Register
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
            Showing {records.length} vehicle(s)
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Time</th>
                <th style={{ width: '140px' }}>Vehicle No.</th>
                <th style={{ width: '150px' }}>Driver Name</th>
                <th className="num-cell" style={{ width: '100px' }}>Total Boxes</th>
                <th className="num-cell" style={{ width: '110px' }}>Total Qty</th>
                <th style={{ width: '180px' }}>Source / From</th>
                <th>Remarks</th>
                {isDataEntry && <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {rec.time}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontFamily: 'var(--font-mono)' }}>
                        {rec.vehicleNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {rec.driverName || '—'}
                    </td>
                    <td className="num-cell" style={{ fontWeight: '600' }}>
                      {rec.boxes.toLocaleString()}
                    </td>
                    <td className="num-cell" style={{ fontWeight: '700', color: '#0284c7' }}>
                      {rec.quantity.toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {rec.source || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {rec.remarks || '—'}
                    </td>
                    {isDataEntry && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 6px' }}
                            onClick={() => handleOpenEdit(rec)}
                            title="Edit vehicle entry"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 6px', color: '#dc2626' }}
                            onClick={() => handleDelete(rec.id)}
                            title="Delete vehicle entry"
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
                  <td colSpan={isDataEntry ? 8 : 7} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--color-text-subtle)' }}>
                      No incoming vehicle unloading records found for {formatDateDisplay(selectedDate)}.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: '700', borderTop: '2px solid var(--color-border)' }}>
                  <td colSpan={3}>TOTAL UNLOADING</td>
                  <td className="num-cell">{totalBoxes.toLocaleString()}</td>
                  <td className="num-cell" style={{ color: '#0284c7' }}>{totalQuantity.toLocaleString()}</td>
                  <td colSpan={isDataEntry ? 3 : 2} style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                    Total inward receipt
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Unloading */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRecord ? 'Edit Inward Vehicle Record' : 'Record Incoming Vehicle Unloading'}
        >
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="unloading-time">Arrival Time *</label>
                <input
                  id="unloading-time"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 09:15 AM"
                  value={formValues.time}
                  onChange={(e) => setFormValues({ ...formValues, time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="unloading-veh-no">Vehicle Number *</label>
                <input
                  id="unloading-veh-no"
                  type="text"
                  className="form-control"
                  placeholder="e.g. MH-12-RN-4821"
                  value={formValues.vehicleNumber}
                  onChange={(e) => setFormValues({ ...formValues, vehicleNumber: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="unloading-driver">Driver Name</label>
              <input
                id="unloading-driver"
                type="text"
                className="form-control"
                placeholder="Driver full name"
                value={formValues.driverName}
                onChange={(e) => setFormValues({ ...formValues, driverName: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="unloading-boxes">Total Boxes *</label>
                <input
                  id="unloading-boxes"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  placeholder="e.g. 45"
                  value={formValues.boxes}
                  onChange={(e) => setFormValues({ ...formValues, boxes: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="unloading-qty">Total Quantity *</label>
                <input
                  id="unloading-qty"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  placeholder="e.g. 900"
                  value={formValues.quantity}
                  onChange={(e) => setFormValues({ ...formValues, quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="unloading-source">Source / Origin Plant</label>
              <input
                id="unloading-source"
                type="text"
                className="form-control"
                placeholder="e.g. Vendor Line 1 / Pune Depot"
                value={formValues.source}
                onChange={(e) => setFormValues({ ...formValues, source: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="unloading-remarks">Remarks</label>
              <textarea
                id="unloading-remarks"
                rows={2}
                className="form-control"
                placeholder="Damage checks, challan number, consignment notes..."
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
                {saving ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Inward Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
