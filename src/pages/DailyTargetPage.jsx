import React, { useState, useEffect } from 'react';
import {
  Target,
  Save,
  CheckCircle,
  AlertCircle,
  Layers,
  Calendar,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';
import { productionService } from '../services/productionService';
import { SHIFT_HOURS, formatDateDisplay } from '../utils/dateUtils';
import {
  calculateRemaining,
  calculateAchievementPercentage
} from '../utils/calculationUtils';

export default function DailyTargetPage({ selectedDate, currentUser, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [scanningTarget, setScanningTarget] = useState('');
  const [batchTarget, setBatchTarget] = useState('');
  const [distributionMode, setDistributionMode] = useState('all'); // 'all' or 'adaptive'
  const [savedTarget, setSavedTarget] = useState(null);
  const [hourlyRecords, setHourlyRecords] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const isDataEntry = currentUser?.role === 'DATA ENTRY';

  useEffect(() => {
    loadTargetData();
  }, [selectedDate]);

  const loadTargetData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const [targetData, hourlyData] = await Promise.all([
        productionService.getDailyTarget(selectedDate),
        productionService.getHourlyProduction(selectedDate)
      ]);

      if (targetData) {
        setSavedTarget(targetData);
        setScanningTarget(String(targetData.scanningTarget || ''));
        setBatchTarget(targetData.batchTarget !== null ? String(targetData.batchTarget) : '');
      } else {
        setSavedTarget(null);
        setScanningTarget('1000'); // default sensible suggested target
        setBatchTarget('500');
      }
      setHourlyRecords(hourlyData);
    } catch (err) {
      console.error('Error loading target:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDataEntry) return;

    if (!scanningTarget || Number(scanningTarget) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid scanning target greater than 0.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: selectedDate,
        scanningTarget: Number(scanningTarget),
        batchTarget: batchTarget !== '' ? Number(batchTarget) : null,
        user: currentUser
      };

      const result = await productionService.saveDailyTarget(payload);
      
      // Auto-calibrate hourly production targets to achieve the daily target
      const updatedSlots = await productionService.distributeDailyTargetAcrossHours(
        selectedDate,
        Number(scanningTarget),
        distributionMode,
        currentUser
      );

      setSavedTarget(result);
      setHourlyRecords(updatedSlots);
      setMessage({
        type: 'success',
        text: `Daily target for ${formatDateDisplay(selectedDate)} set to ${Number(scanningTarget).toLocaleString()}! Hourly production targets adjusted to achieve the daily goal.`
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save daily target. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const targetVal = savedTarget ? savedTarget.scanningTarget : Number(scanningTarget) || 0;
  const loggedSlots = hourlyRecords.filter((h) => h.isUpdated);
  const unloggedSlots = hourlyRecords.filter((h) => !h.isUpdated);
  
  const achievedVal = loggedSlots.reduce((sum, h) => sum + (Number(h.achieved) || 0), 0);
  const remainingVal = calculateRemaining(targetVal, achievedVal);
  const achievementPct = calculateAchievementPercentage(targetVal, achievedVal);

  const parsedTarget = Number(scanningTarget) || 0;
  const standardHourlyRate = Math.floor(parsedTarget / 8);

  const unloggedCount = unloggedSlots.length;
  const adaptiveHourlyRate = unloggedCount > 0 ? Math.ceil(remainingVal / unloggedCount) : standardHourlyRate;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Target size={24} style={{ color: 'var(--color-primary)' }} />
            <span>Daily Production Target & Hourly Calibration</span>
          </h1>
          <p className="page-subtitle">
            Set daily targets and calibrate hourly shift quotas to achieve goals: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('hourly-scanning')}
          >
            Go to Hourly Scanning
            <ArrowRight size={14} />
          </button>
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

      {/* Target Progress Summary Box */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-title">Daily Target</span>
          <div className="stat-value">{targetVal.toLocaleString()}</div>
          <span className="stat-meta">Set for {formatDateDisplay(selectedDate)}</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Achieved (Scanning)</span>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {achievedVal.toLocaleString()}
          </div>
          <span className="stat-meta">{loggedSlots.length} of 8 hours logged</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Remaining to Achieve</span>
          <div className="stat-value" style={{ color: remainingVal > 0 ? '#b91c1c' : '#15803d' }}>
            {remainingVal.toLocaleString()}
          </div>
          <span className="stat-meta">To hit 100% daily target</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Achievement %</span>
          <div className="stat-value">{achievementPct}%</div>
          <div className="progress-track">
            <div
              className={`progress-fill ${achievementPct >= 100 ? 'green' : achievementPct >= 80 ? 'blue' : 'amber'}`}
              style={{ width: `${Math.min(100, Number(achievementPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Configuration & Calibration Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
            Target Definition & Hourly Distribution ({formatDateDisplay(selectedDate)})
          </span>
          {savedTarget && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
              Last updated: {new Date(savedTarget.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {savedTarget.updatedBy}
            </span>
          )}
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Shift Date</label>
                <input
                  type="text"
                  className="form-control"
                  value={`${formatDateDisplay(selectedDate)} (${selectedDate})`}
                  disabled
                  readOnly
                />
                <span className="form-hint">Targets are strictly bound to this selected date</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scanning-target">
                  Daily Scanning Target (Pcs) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="scanning-target"
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  placeholder="e.g. 1000 or 1200"
                  value={scanningTarget}
                  onChange={(e) => setScanningTarget(e.target.value)}
                  disabled={!isDataEntry || saving}
                  required
                />
                <span className="form-hint">Primary hourly scanning line quota (in Pcs)</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batch-target">
                  Optional Batch Target (Pcs)
                </label>
                <input
                  id="batch-target"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  placeholder="e.g. 500 (optional)"
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value)}
                  disabled={!isDataEntry || saving}
                />
                <span className="form-hint">Secondary batch process production target (in Pcs)</span>
              </div>
            </div>

            {/* Hourly Target Distribution Logic Selector */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Zap size={18} style={{ color: '#0284c7' }} />
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  How should Hourly Production targets change to achieve this daily target?
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {/* Option 1: Equal distribution */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: `2px solid ${distributionMode === 'all' ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                    background: distributionMode === 'all' ? '#eff6ff' : '#ffffff',
                    cursor: isDataEntry ? 'pointer' : 'default'
                  }}
                >
                  <input
                    type="radio"
                    name="distributionMode"
                    value="all"
                    checked={distributionMode === 'all'}
                    onChange={() => setDistributionMode('all')}
                    disabled={!isDataEntry}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                      Standard Shift Distribution (All 8 Hours)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Sets hourly target to <strong>~{standardHourlyRate} pcs/hr</strong> across all 8 periods (`Daily Target ÷ 8`).
                    </div>
                  </div>
                </label>

                {/* Option 2: Adaptive catch-up */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: `2px solid ${distributionMode === 'adaptive' ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                    background: distributionMode === 'adaptive' ? '#eff6ff' : '#ffffff',
                    cursor: isDataEntry ? 'pointer' : 'default'
                  }}
                >
                  <input
                    type="radio"
                    name="distributionMode"
                    value="adaptive"
                    checked={distributionMode === 'adaptive'}
                    onChange={() => setDistributionMode('adaptive')}
                    disabled={!isDataEntry}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                      Adaptive Goal Catch-Up (Remaining Hours)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Keeps past logged hours unchanged. Automatically calculates required pace for the remaining {unloggedCount} hours (<strong>~{adaptiveHourlyRate} pcs/hr</strong>) to achieve the {parsedTarget} target!
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Live Hourly Slots Target Breakdown Preview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                <span>Hourly Production Target Allocation Preview</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {SHIFT_HOURS.map((hour, idx) => {
                  const match = hourlyRecords.find((r) => r.hour === hour);
                  const isLogged = match?.isUpdated;
                  
                  let previewTarget = standardHourlyRate;
                  if (distributionMode === 'adaptive') {
                    if (isLogged) {
                      previewTarget = match.target;
                    } else {
                      previewTarget = adaptiveHourlyRate;
                    }
                  }

                  return (
                    <div
                      key={hour}
                      style={{
                        padding: '8px 10px',
                        background: '#ffffff',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-mono)' }}>
                        {hour}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', marginTop: '2px' }}>
                        {previewTarget} <span style={{ fontSize: '0.68rem', fontWeight: '400', color: 'var(--color-text-subtle)' }}>target</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isLogged ? '#15803d' : 'var(--color-text-subtle)', marginTop: '2px' }}>
                        {isLogged ? `Logged: ${match.achieved}` : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isDataEntry ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? 'Calibrating...' : 'Set Daily Target & Update Hourly Slots'}
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                  Hourly targets in Hourly Scanning will instantly update according to your selected calibration mode!
                </span>
              </div>
            ) : (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <strong>Viewer Note:</strong> Target modification is restricted to Data Entry role.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
