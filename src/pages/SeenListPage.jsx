import React, { useState, useEffect } from 'react';
import {
  Eye,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Plus
} from 'lucide-react';
import { seenService } from '../services/seenService';
import { SHIFT_HOURS, formatDateDisplay } from '../utils/dateUtils';

export default function SeenListPage({ selectedDate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [seenRecords, setSeenRecords] = useState([]);
  const [manualSlot, setManualSlot] = useState(SHIFT_HOURS[0]);
  const [logging, setLogging] = useState(false);
  const [message, setMessage] = useState('');

  const isViewer = currentUser?.role === 'VIEWER';

  useEffect(() => {
    loadSeenData();
  }, [selectedDate]);

  const loadSeenData = async () => {
    setLoading(true);
    try {
      const data = await seenService.getSeenRecords(selectedDate);
      setSeenRecords(data);
    } catch (err) {
      console.error('Error loading seen records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Allow viewer/supervisor to register a sign-off or view
  const handleLogView = async () => {
    setLogging(true);
    try {
      await seenService.saveSeenRecord({
        viewerId: currentUser?.id || 'V001',
        viewerName: currentUser?.name || 'Supervisor',
        date: selectedDate,
        module: 'Hourly Scanning',
        hour: manualSlot
      });
      setMessage(`Logged audit view for ${manualSlot} successfully.`);
      setTimeout(() => setMessage(''), 3000);
      loadSeenData();
    } catch (err) {
      console.error(err);
    } finally {
      setLogging(false);
    }
  };

  // Unique viewers count
  const uniqueViewers = new Set(seenRecords.map((r) => r.viewerId)).size;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Eye size={24} style={{ color: 'var(--color-primary)' }} />
            <span>Hourly Production Audit & Seen List</span>
          </h1>
          <p className="page-subtitle">
            Supervisor & HOD View Audit Log • Date: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadSeenData}
          >
            <RotateCcw size={14} />
            Refresh Log
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            fontSize: '0.875rem'
          }}
        >
          {message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-title">Total Views Logged</span>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {seenRecords.length}
          </div>
          <span className="stat-meta">Shift review entries</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Unique Reviewers</span>
          <div className="stat-value" style={{ color: '#0369a1' }}>
            {uniqueViewers}
          </div>
          <span className="stat-meta">
            Seen By: <strong>{uniqueViewers} {uniqueViewers === 1 ? 'User' : 'Users'}</strong>
          </span>
        </div>

        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <span className="stat-title">Supervisor / Viewer Action</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={manualSlot}
              onChange={(e) => setManualSlot(e.target.value)}
            >
              {SHIFT_HOURS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleLogView}
              disabled={logging}
            >
              <UserCheck size={14} />
              {logging ? 'Logging...' : 'Log Seen Verification'}
            </button>
          </div>
          <span className="stat-meta" style={{ marginTop: '8px' }}>
            Recorded as: <strong>{currentUser?.name} ({currentUser?.role})</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
            Audit Verification Table ({formatDateDisplay(selectedDate)})
          </span>
          <span className="badge badge-role">
            Seen By: {uniqueViewers} {uniqueViewers === 1 ? 'User' : 'Users'}
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Viewer ID</th>
                <th>Name / Role</th>
                <th style={{ width: '130px' }}>Date</th>
                <th style={{ width: '150px' }}>Module</th>
                <th style={{ width: '150px' }}>Hour Slot</th>
                <th style={{ width: '140px' }}>Viewed Time</th>
              </tr>
            </thead>
            <tbody>
              {seenRecords.length > 0 ? (
                seenRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155', fontFamily: 'var(--font-mono)' }}>
                        {r.viewerId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{r.viewerName}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                        Verified Reviewer
                      </span>
                    </td>
                    <td>{formatDateDisplay(r.date)}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        {r.module}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {r.hour}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {new Date(r.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--color-text-subtle)' }}>
                      No viewer activity logged for {formatDateDisplay(selectedDate)} yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
