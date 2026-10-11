import React, { useState, useEffect } from 'react';
import {
  Clock,
  Edit,
  Save,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  Zap
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { productionService } from '../services/productionService';
import { seenService } from '../services/seenService';
import { formatDateDisplay } from '../utils/dateUtils';
import {
  calculateDifference,
  calculateAchievementPercentage,
  calculateProductionStatus,
  calculateRemaining
} from '../utils/calculationUtils';


export default function HourlyScanningPage({ selectedDate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [hourlyRecords, setHourlyRecords] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [seenCounts, setSeenCounts] = useState({});
  const [editingSlot, setEditingSlot] = useState(null); // Slot object being edited by Data Entry
  const [inspectingSlot, setInspectingSlot] = useState(null); // Slot being viewed by Viewer
  const [slotSeenUsers, setSlotSeenUsers] = useState([]);
  const [formValues, setFormValues] = useState({
    target: '',
    achieved: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });

  const isDataEntry = currentUser?.role === 'DATA ENTRY';
  const isViewer = currentUser?.role === 'VIEWER';

  useEffect(() => {
    loadHourlyData();
  }, [selectedDate]);

  const loadHourlyData = async () => {
    setLoading(true);
    try {
      const [records, targetData, allSeen] = await Promise.all([
        productionService.getHourlyProduction(selectedDate),
        productionService.getDailyTarget(selectedDate),
        seenService.getSeenRecords(selectedDate)
      ]);

      setHourlyRecords(records);
      setDailyTarget(targetData);

      // Build seen counts per hour
      const counts = {};
      allSeen.forEach((s) => {
        counts[s.hour] = (counts[s.hour] || 0) + 1;
      });
      setSeenCounts(counts);

      // If user is a Viewer visiting this page, record viewed status for the first active/updated slot
      if (isViewer && records.length > 0) {
        const firstUpdated = records.find((r) => r.isUpdated) || records[0];
        if (firstUpdated) {
          await seenService.saveSeenRecord({
            viewerId: currentUser?.id || 'V001',
            viewerName: currentUser?.name || 'Supervisor',
            date: selectedDate,
            module: 'Hourly Scanning',
            hour: firstUpdated.hour
          });
        }
      }
    } catch (err) {
      console.error('Error loading hourly production:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal (Data Entry)
  const handleOpenEdit = (slot) => {
    setEditingSlot(slot);
    setFormValues({
      target: slot.target || '125',
      achieved: slot.isUpdated ? slot.achieved : '',
      remarks: slot.remarks || ''
    });
    setNotification({ type: '', text: '' });
  };

  // Open Inspect Modal (Viewer or anyone)
  const handleInspectSlot = async (slot) => {
    setInspectingSlot(slot);

    // If viewer is opening this update, record activity in Seen List!
    if (isViewer) {
      await seenService.saveSeenRecord({
        viewerId: currentUser?.id || 'V001',
        viewerName: currentUser?.name || 'Supervisor',
        date: selectedDate,
        module: 'Hourly Scanning',
        hour: slot.hour
      });
    }

    // Load who has seen this slot
    const viewers = await seenService.getSeenForHour(selectedDate, slot.hour);
    setSlotSeenUsers(viewers);

    // Refresh counts
    const allSeen = await seenService.getSeenRecords(selectedDate);
    const counts = {};
    allSeen.forEach((s) => {
      counts[s.hour] = (counts[s.hour] || 0) + 1;
    });
    setSeenCounts(counts);
  };

  // Save hourly update
  const handleSaveHourly = async (e) => {
    e.preventDefault();
    if (!editingSlot || !isDataEntry) return;

    setSaving(true);
    try {
      const targetNum = Number(formValues.target) || 0;
      const achievedNum = Number(formValues.achieved) || 0;

      const payload = {
        date: selectedDate,
        hour: editingSlot.hour,
        target: targetNum,
        achieved: achievedNum,
        remarks: formValues.remarks,
        user: currentUser
      };

      await productionService.saveHourlyProduction(payload);
      setEditingSlot(null);
      setNotification({
        type: 'success',
        text: `Production for period ${editingSlot.hour} saved successfully!`
      });
      await loadHourlyData();
    } catch (err) {
      setNotification({ type: 'error', text: 'Failed to update hourly production.' });
    } finally {
      setSaving(false);
    }
  };

  // Real-time calculation helpers for edit form
  const previewDiff = calculateDifference(formValues.target, formValues.achieved);
  const previewPct = calculateAchievementPercentage(formValues.target, formValues.achieved);
  const previewStatus = calculateProductionStatus(formValues.target, formValues.achieved, true);

  // Totals for day
  const totalTarget = dailyTarget?.scanningTarget || hourlyRecords.reduce((sum, h) => sum + (Number(h.target) || 0), 0);
  const loggedSlots = hourlyRecords.filter((h) => h.isUpdated);
  const unloggedSlots = hourlyRecords.filter((h) => !h.isUpdated);

  const totalAchieved = loggedSlots.reduce((sum, h) => sum + (Number(h.achieved) || 0), 0);
  const totalDiff = totalAchieved - totalTarget;
  const totalPct = calculateAchievementPercentage(totalTarget, totalAchieved);
  const remainingToProduce = calculateRemaining(totalTarget, totalAchieved);

  // Dynamic required hourly run-rate to hit target
  const unloggedCount = unloggedSlots.length;
  const requiredPace = unloggedCount > 0 ? Math.ceil(remainingToProduce / unloggedCount) : 0;

  // Handle auto-recalibration of remaining un-updated hours
  const handleRecalibrateRemaining = async () => {
    if (!isDataEntry) return;
    try {
      setLoading(true);
      await productionService.distributeDailyTargetAcrossHours(
        selectedDate,
        totalTarget,
        'adaptive',
        currentUser
      );
      setNotification({
        type: 'success',
        text: `Remaining ${unloggedCount} hours auto-calibrated to ${requiredPace} units/hour to hit the ${totalTarget.toLocaleString()} daily target!`
      });
      await loadHourlyData();
    } catch (err) {
      setNotification({ type: 'error', text: 'Failed to recalibrate remaining hours.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Clock size={24} style={{ color: 'var(--color-primary)' }} />
            <span>Hourly Scanning Production Grid</span>
          </h1>
          <p className="page-subtitle">
            8 Shift Hours • 8:30 AM to 5:00 PM • Date: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          {isDataEntry && unloggedCount > 0 && totalTarget > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRecalibrateRemaining}
              title={`Distribute remaining ${remainingToProduce} units equally across remaining ${unloggedCount} hours`}
            >
              <Zap size={14} />
              Auto-Calibrate Remaining ({requiredPace}/hr)
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadHourlyData}
          >
            Refresh Grid
          </button>
        </div>
      </div>

      {/* Target Achievement Run-Rate Banner */}
      {dailyTarget && unloggedCount > 0 && remainingToProduce > 0 && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#14532d' }}>
                Required Run-Rate: <strong>{requiredPace} units / hour</strong> to achieve daily target of {totalTarget.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
                Remaining to produce: <strong>{remainingToProduce.toLocaleString()} units</strong> across <strong>{unloggedCount} uncompleted periods</strong>
              </div>
            </div>
          </div>

          {isDataEntry && (
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={handleRecalibrateRemaining}
            >
              <Zap size={14} />
              Set Remaining Slots to {requiredPace}/hr
            </button>
          )}
        </div>
      )}

      {notification.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${notification.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: notification.type === 'success' ? '#15803d' : '#b91c1c'
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}


      {/* Summary KPI Strip */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-title">Shift Target</span>
          <div className="stat-value">{totalTarget.toLocaleString()}</div>
          <span className="stat-meta">{formatDateDisplay(selectedDate)}</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Shift Achieved</span>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {totalAchieved.toLocaleString()}
          </div>
          <span className="stat-meta">{hourlyRecords.filter((h) => h.isUpdated).length} of 8 hours logged</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total Variance</span>
          <div className="stat-value" style={{ color: totalDiff < 0 ? '#b91c1c' : '#15803d' }}>
            {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
          </div>
          <span className="stat-meta">Cumulative difference</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Overall Shift %</span>
          <div className="stat-value">{totalPct}%</div>
          <div className="progress-track">
            <div
              className={`progress-fill ${totalPct >= 100 ? 'green' : totalPct >= 80 ? 'blue' : 'amber'}`}
              style={{ width: `${Math.min(100, Number(totalPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Hourly Scanning Production Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Clock size={18} style={{ color: 'var(--color-primary)' }} />
            Hourly Production Progress Table
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
            Lunch Break: 12:30 PM – 1:00 PM (No scanning)
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Hour Slot</th>
                <th className="num-cell" style={{ width: '100px' }}>Target</th>
                <th className="num-cell" style={{ width: '100px' }}>Achieved</th>
                <th className="num-cell" style={{ width: '100px' }}>Difference</th>
                <th className="num-cell" style={{ width: '120px' }}>Achievement %</th>
                <th style={{ width: '140px' }}>Status</th>
                <th>Remarks / Notes</th>
                <th style={{ width: '100px' }}>Seen By</th>
                <th style={{ textAlign: 'center', width: '110px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {hourlyRecords.map((slot, index) => {
                const isUpdated = slot.isUpdated;
                const seenCount = seenCounts[slot.hour] || 0;

                return (
                  <tr
                    key={slot.id || index}
                    style={{
                      backgroundColor: !isUpdated ? '#fcfcfd' : undefined
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                        {slot.hour}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
                        Period #{index + 1}
                      </span>
                    </td>

                    <td className="num-cell">
                      {slot.target}
                    </td>

                    <td className="num-cell" style={{ fontWeight: '700', color: isUpdated ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}>
                      {isUpdated ? slot.achieved : '—'}
                    </td>

                    <td
                      className="num-cell"
                      style={{
                        color: !isUpdated
                          ? 'var(--color-text-subtle)'
                          : slot.difference < 0
                            ? '#b91c1c'
                            : slot.difference > 0
                              ? '#15803d'
                              : 'var(--color-text-main)'
                      }}
                    >
                      {isUpdated ? (slot.difference > 0 ? `+${slot.difference}` : slot.difference) : '—'}
                    </td>

                    <td className="num-cell">
                      {isUpdated ? `${slot.achievementPercentage}%` : '—'}
                    </td>

                    <td>
                      <StatusBadge status={slot.status} />
                    </td>

                    <td>
                      <div
                        style={{
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8rem',
                          color: slot.remarks ? 'var(--color-text-muted)' : 'var(--color-text-subtle)'
                        }}
                        title={slot.remarks || 'No remarks entered'}
                      >
                        {slot.remarks || '—'}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        onClick={() => handleInspectSlot(slot)}
                        title="Click to view supervisor/viewer audit trail"
                      >
                        <Eye size={12} />
                        {seenCount > 0 ? `${seenCount} ${seenCount === 1 ? 'User' : 'Users'}` : '0 Users'}
                      </button>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {isDataEntry ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px' }}
                          onClick={() => handleOpenEdit(slot)}
                        >
                          <Edit size={13} />
                          {isUpdated ? 'Update' : 'Enter'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px' }}
                          onClick={() => handleInspectSlot(slot)}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: '700', borderTop: '2px solid var(--color-border)' }}>
                <td>TOTAL SHIFT</td>
                <td className="num-cell">{totalTarget}</td>
                <td className="num-cell" style={{ color: 'var(--color-primary)' }}>{totalAchieved}</td>
                <td className="num-cell" style={{ color: totalDiff < 0 ? '#b91c1c' : '#15803d' }}>
                  {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                </td>
                <td className="num-cell">{totalPct}%</td>
                <td>
                  <StatusBadge
                    status={
                      totalAchieved === 0
                        ? 'Not Updated'
                        : totalAchieved >= totalTarget
                          ? 'Above Target'
                          : totalPct >= 90
                            ? 'On Target'
                            : 'Below Target'
                    }
                  />
                </td>
                <td colSpan={3} style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                  Total scanning contribution across all 8 periods
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Data Entry Input Modal */}
      {editingSlot && (
        <Modal
          isOpen={!!editingSlot}
          onClose={() => setEditingSlot(null)}
          title={`Hourly Production Entry (${editingSlot.hour})`}
        >
          <form onSubmit={handleSaveHourly}>
            <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.8rem' }}>
              <div>Shift Date: <strong>{formatDateDisplay(selectedDate)}</strong></div>
              <div>Hour Slot: <strong>{editingSlot.hour}</strong></div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slot-target">Hourly Target (Units) *</label>
              <input
                id="slot-target"
                type="number"
                min="1"
                step="1"
                className="form-control"
                value={formValues.target}
                onChange={(e) => setFormValues({ ...formValues, target: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slot-achieved">Actual Achieved (Units) *</label>
              <input
                id="slot-achieved"
                type="number"
                min="0"
                step="1"
                className="form-control"
                placeholder="Enter scanned quantity"
                value={formValues.achieved}
                onChange={(e) => setFormValues({ ...formValues, achieved: e.target.value })}
                autoFocus
                required
              />
            </div>

            {/* Live Calculation preview */}
            {formValues.achieved !== '' && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#1e3a8a', marginBottom: '6px' }}>
                  Automatic Calculation Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.82rem' }}>
                  <div>
                    Difference: <strong>{previewDiff > 0 ? `+${previewDiff}` : previewDiff}</strong>
                  </div>
                  <div>
                    Achievement: <strong>{previewPct}%</strong>
                  </div>
                  <div>
                    Status: <StatusBadge status={previewStatus} />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="slot-remarks">Remarks / Operational Notes</label>
              <textarea
                id="slot-remarks"
                rows={3}
                className="form-control"
                placeholder="Line speed, mechanical stoppage, quality checks, rework notes..."
                value={formValues.remarks}
                onChange={(e) => setFormValues({ ...formValues, remarks: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingSlot(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Hourly Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Viewer Inspection / Seen Details */}
      {inspectingSlot && (
        <Modal
          isOpen={!!inspectingSlot}
          onClose={() => setInspectingSlot(null)}
          title={`Hourly Production Details • ${inspectingSlot.hour}`}
        >
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-card" style={{ padding: '12px' }}>
                <span className="stat-title">Target Quota</span>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{inspectingSlot.target}</div>
              </div>
              <div className="stat-card" style={{ padding: '12px' }}>
                <span className="stat-title">Actual Output</span>
                <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>
                  {inspectingSlot.isUpdated ? inspectingSlot.achieved : 'Not Updated'}
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Achievement Rate:</span>
                <strong>{inspectingSlot.isUpdated ? `${inspectingSlot.achievementPercentage}%` : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Variance:</span>
                <strong>{inspectingSlot.isUpdated ? (inspectingSlot.difference > 0 ? `+${inspectingSlot.difference}` : inspectingSlot.difference) : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Production Status:</span>
                <StatusBadge status={inspectingSlot.status} />
              </div>
            </div>

            {inspectingSlot.remarks && (
              <div style={{ marginBottom: '16px' }}>
                <span className="form-label">Operator Notes</span>
                <p style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)', fontSize: '0.85rem' }}>
                  {inspectingSlot.remarks}
                </p>
              </div>
            )}

            {/* Audit / Seen List for this hour */}
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} />
                <span>Seen By ({slotSeenUsers.length} Supervisors / Viewers)</span>
              </span>
              {slotSeenUsers.length > 0 ? (
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: '4px' }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Viewer ID</th>
                        <th>Name</th>
                        <th>Viewed Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotSeenUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.viewerId}</td>
                          <td style={{ fontWeight: '500' }}>{u.viewerName}</td>
                          <td>{new Date(u.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', fontStyle: 'italic', padding: '8px' }}>
                  No supervisor audit entries logged yet for this period.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectingSlot(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
