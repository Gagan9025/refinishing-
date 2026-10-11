import React, { useState, useEffect } from 'react';
import {
  Target,
  Clock,
  Layers,
  Users,
  ArrowUpFromLine,
  ArrowDownToLine,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { productionService } from '../services/productionService';
import { batchService } from '../services/batchService';
import { vehicleService } from '../services/vehicleService';
import { attendanceService } from '../services/attendanceService';
import {
  calculateRemaining,
  calculateAchievementPercentage,
  calculateProductionStatus
} from '../utils/calculationUtils';
import { formatDateDisplay, getCurrentHourSlot } from '../utils/dateUtils';

export default function DashboardPage({ selectedDate, currentUser, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [hourlyRecords, setHourlyRecords] = useState([]);
  const [batchRecords, setBatchRecords] = useState([]);
  const [unloadingRecords, setUnloadingRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [targetData, hourlyData, batchData, unloadData, loadData, attData] = await Promise.all([
        productionService.getDailyTarget(selectedDate),
        productionService.getHourlyProduction(selectedDate),
        batchService.getBatchProduction(selectedDate),
        vehicleService.getVehicleUnloading(selectedDate),
        vehicleService.getVehicleLoading(selectedDate),
        attendanceService.getAttendance(selectedDate)
      ]);

      setDailyTarget(targetData);
      setHourlyRecords(hourlyData);
      setBatchRecords(batchData);
      setUnloadingRecords(unloadData);
      setLoadingRecords(loadData);
      setAttendanceRecords(attData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for Production
  const scanningTarget = dailyTarget?.scanningTarget || 0;
  const scanningAchieved = hourlyRecords
    .filter((h) => h.isUpdated)
    .reduce((sum, h) => sum + (Number(h.achieved) || 0), 0);
  const scanningRemaining = calculateRemaining(scanningTarget, scanningAchieved);
  const scanningAchievementPct = calculateAchievementPercentage(scanningTarget, scanningAchieved);

  // Current Hour Slot info
  const currentSlotHour = getCurrentHourSlot();
  const currentSlotRecord = hourlyRecords.find((h) => h.hour === currentSlotHour) || hourlyRecords[0];

  const unloggedHourlyCount = hourlyRecords.filter((h) => !h.isUpdated).length;
  const requiredRunRate = unloggedHourlyCount > 0 ? Math.ceil(scanningRemaining / unloggedHourlyCount) : 0;

  // Latest updated hourly record
  const updatedHourlyRecords = hourlyRecords.filter((h) => h.isUpdated);
  const latestUpdatedRecord = updatedHourlyRecords.length > 0
    ? updatedHourlyRecords[updatedHourlyRecords.length - 1]
    : null;

  // Batch calculations
  const batchTarget = dailyTarget?.batchTarget || null;
  const batchAchieved = batchRecords.reduce((sum, b) => sum + (Number(b.batchQuantity) || 0), 0);
  const batchRemaining = batchTarget ? calculateRemaining(batchTarget, batchAchieved) : null;
  const batchPct = batchTarget ? calculateAchievementPercentage(batchTarget, batchAchieved) : null;


  // Attendance calculations
  const totalEmployees = attendanceRecords.length;
  const presentEmployees = attendanceRecords.filter((a) => a.status === 'Present').length;
  const absentEmployees = attendanceRecords.filter((a) => a.status === 'Absent').length;

  // Vehicle Unloading (Inward)
  const unloadingVehiclesCount = unloadingRecords.length;
  const unloadingBoxes = unloadingRecords.reduce((sum, v) => sum + (Number(v.boxes) || 0), 0);
  const unloadingQuantity = unloadingRecords.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  // Vehicle Loading (Outward)
  const loadingVehiclesCount = loadingRecords.length;
  const loadingBoxes = loadingRecords.reduce((sum, v) => sum + (Number(v.boxes) || 0), 0);
  const loadingQuantity = loadingRecords.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
            <span>Production Overview Dashboard</span>
          </h1>
          <p className="page-subtitle">
            Operations summary for shift date: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
          >
            Refresh
          </button>
          {currentUser?.role === 'DATA ENTRY' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('hourly-scanning')}
            >
              Enter Hourly Output
            </button>
          )}
        </div>
      </div>

      {/* Notice if target not set */}
      {!dailyTarget && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#92400e' }}>
              <AlertCircle size={20} />
              <span>
                <strong>Daily Target not configured for {formatDateDisplay(selectedDate)}.</strong> Please define today's scanning and batch targets.
              </span>
            </div>
            {currentUser?.role === 'DATA ENTRY' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('daily-target')}
              >
                Set Target Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row 1: High-Level Production KPIs */}
      <div className="grid-cols-4">
        {/* Daily Target */}
        <StatCard
          title="Daily Scanning Target"
          value={scanningTarget.toLocaleString()}
          subtext={`Target for ${formatDateDisplay(selectedDate)}`}
          icon={Target}
        />

        {/* Total Achieved */}
        <StatCard
          title="Total Achieved (Scanning)"
          value={scanningAchieved.toLocaleString()}
          subtext={`${scanningAchievementPct}% of daily target`}
          progress={scanningAchievementPct}
          progressColor={scanningAchievementPct >= 100 ? 'green' : scanningAchievementPct >= 80 ? 'blue' : 'amber'}
          icon={CheckCircle}
        />

        {/* Remaining Target */}
        <StatCard
          title="Remaining Target"
          value={scanningRemaining.toLocaleString()}
          subtext={scanningRemaining === 0 ? 'Target fully completed!' : 'To reach shift quota'}
          icon={TrendingUp}
        />

        {/* Achievement % */}
        <StatCard
          title="Achievement Rate"
          value={`${scanningAchievementPct}%`}
          badge={
            <StatusBadge
              status={
                scanningAchieved === 0
                  ? 'Not Updated'
                  : scanningAchieved >= scanningTarget && scanningTarget > 0
                  ? 'Above Target'
                  : scanningAchievementPct >= 90
                  ? 'On Target'
                  : 'Below Target'
              }
            />
          }
          icon={TrendingUp}
        />
      </div>

      {/* Row 2: Current Hour & Latest Update */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        {/* Current Hour Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title">
              <Clock size={18} style={{ color: 'var(--color-accent)' }} />
              Active Shift Period
            </span>
            <span className="badge badge-role">
              {currentSlotHour}
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)' }}>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Slot Target</span>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {currentSlotRecord?.target || 125}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)' }}>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Slot Achieved</span>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', marginTop: '4px' }}>
                  {currentSlotRecord?.isUpdated ? currentSlotRecord.achieved : '—'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)' }}>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Slot Status</span>
                <div style={{ marginTop: '6px' }}>
                  <StatusBadge status={currentSlotRecord?.status || 'Not Updated'} />
                </div>
              </div>
            </div>

            {requiredRunRate > 0 && scanningRemaining > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '6px 10px', fontSize: '0.78rem', color: '#166534', marginBottom: '12px' }}>
                ⚡ <strong>Target Pace:</strong> Produce <strong>~{requiredRunRate} units/hr</strong> across remaining {unloggedHourlyCount} hour(s) to hit the daily goal.
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              <span>
                Last Updated: <strong>{currentSlotRecord?.isUpdated ? new Date(currentSlotRecord.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending entry'}</strong>
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('hourly-scanning')}
              >
                View Hourly Grid
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Latest Hourly Production Update Banner */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title">
              <Sparkles size={18} style={{ color: '#d97706' }} />
              Latest Production Update
            </span>
            {latestUpdatedRecord && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                Slot: {latestUpdatedRecord.hour}
              </span>
            )}
          </div>
          <div className="card-body">
            {latestUpdatedRecord ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                      {latestUpdatedRecord.achieved} units{' '}
                      <span style={{ fontSize: '0.85rem', fontWeight: '400', color: 'var(--color-text-subtle)' }}>
                        / {latestUpdatedRecord.target} target
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Diff: <strong>{latestUpdatedRecord.difference > 0 ? `+${latestUpdatedRecord.difference}` : latestUpdatedRecord.difference}</strong> • {latestUpdatedRecord.achievementPercentage}%
                    </div>
                  </div>
                  <StatusBadge status={latestUpdatedRecord.status} />
                </div>

                {latestUpdatedRecord.remarks && (
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                    <strong>Note:</strong> {latestUpdatedRecord.remarks}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                  Submitted by: <strong>{latestUpdatedRecord.updatedBy || latestUpdatedRecord.createdBy}</strong> at{' '}
                  {new Date(latestUpdatedRecord.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <Clock size={32} />
                <p>No hourly production entered yet for {formatDateDisplay(selectedDate)}.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Module Snapshot Cards (Batch, Attendance, Vehicle Inward, Vehicle Outward) */}
      <div className="grid-cols-4">
        {/* Batch Production Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '0.9rem' }}>
              <Layers size={16} style={{ color: 'var(--color-primary)' }} />
              Batch Output
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.72rem' }}
              onClick={() => onNavigate('batch-production')}
            >
              Details
            </button>
          </div>
          <div className="card-body">
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>
              {batchAchieved.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Target: <strong>{batchTarget !== null ? batchTarget.toLocaleString() : 'Optional / Not set'}</strong>
            </div>
            {batchTarget && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                  <span>Achieved: {batchPct}%</span>
                  <span>Rem: {batchRemaining}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill blue"
                    style={{ width: `${Math.min(100, Number(batchPct))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Attendance Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '0.9rem' }}>
              <Users size={16} style={{ color: 'var(--color-primary)' }} />
              Attendance
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.72rem' }}
              onClick={() => onNavigate('attendance')}
            >
              Roster
            </button>
          </div>
          <div className="card-body">
            <div className="stat-value" style={{ fontSize: '1.6rem', color: '#16a34a' }}>
              {presentEmployees}{' '}
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-subtle)', fontWeight: '400' }}>
                / {totalEmployees} Present
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.8rem' }}>
              <span style={{ color: '#15803d' }}>
                Present: <strong>{presentEmployees}</strong>
              </span>
              <span style={{ color: '#b91c1c' }}>
                Absent: <strong>{absentEmployees}</strong>
              </span>
            </div>
            <div className="progress-track" style={{ marginTop: '10px' }}>
              <div
                className="progress-fill green"
                style={{ width: `${totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Unloading (Inward) Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '0.9rem' }}>
              <ArrowDownToLine size={16} style={{ color: '#0284c7' }} />
              Vehicle Unloading
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.72rem' }}
              onClick={() => onNavigate('vehicle-unloading')}
            >
              Inward
            </button>
          </div>
          <div className="card-body">
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>
              {unloadingVehiclesCount} <span style={{ fontSize: '0.85rem', fontWeight: '400', color: 'var(--color-text-subtle)' }}>Vehicles</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div>Boxes: <strong>{unloadingBoxes.toLocaleString()}</strong></div>
              <div>Qty: <strong>{unloadingQuantity.toLocaleString()}</strong></div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginTop: '8px' }}>
              Incoming materials received
            </div>
          </div>
        </div>

        {/* Vehicle Loading (Outward) Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '0.9rem' }}>
              <ArrowUpFromLine size={16} style={{ color: '#15803d' }} />
              Vehicle Loading
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.72rem' }}
              onClick={() => onNavigate('vehicle-loading')}
            >
              Outward
            </button>
          </div>
          <div className="card-body">
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>
              {loadingVehiclesCount} <span style={{ fontSize: '0.85rem', fontWeight: '400', color: 'var(--color-text-subtle)' }}>Vehicles</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div>Boxes: <strong>{loadingBoxes.toLocaleString()}</strong></div>
              <div>Qty: <strong>{loadingQuantity.toLocaleString()}</strong></div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginTop: '8px' }}>
              Finished goods dispatched
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
