import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  Users,
  ArrowUpFromLine,
  ArrowDownToLine,
  Sliders,
  Award
} from 'lucide-react';
import { productionService } from '../services/productionService';
import { batchService } from '../services/batchService';
import { vehicleService } from '../services/vehicleService';
import { attendanceService } from '../services/attendanceService';
import { formatDateDisplay } from '../utils/dateUtils';
import {
  calculateRemaining,
  calculateAchievementPercentage,
  calculateProductionStatus
} from '../utils/calculationUtils';

export default function DailySummaryPage({ selectedDate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [hourlyRecords, setHourlyRecords] = useState([]);
  const [batchRecords, setBatchRecords] = useState([]);
  const [unloadingRecords, setUnloadingRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    loadSummaryData();
  }, [selectedDate]);

  const loadSummaryData = async () => {
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
      console.error('Error loading summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations: Scanning
  const scanningTarget = dailyTarget?.scanningTarget || 0;
  const scanningAchieved = hourlyRecords
    .filter((h) => h.isUpdated)
    .reduce((sum, h) => sum + (Number(h.achieved) || 0), 0);
  const scanningRemaining = calculateRemaining(scanningTarget, scanningAchieved);
  const scanningPct = calculateAchievementPercentage(scanningTarget, scanningAchieved);

  // Calculations: Batch
  const batchTarget = dailyTarget?.batchTarget || null;
  const batchAchieved = batchRecords.reduce((sum, b) => sum + (Number(b.batchQuantity) || 0), 0);
  const batchRemaining = batchTarget ? calculateRemaining(batchTarget, batchAchieved) : null;
  const batchPct = batchTarget ? calculateAchievementPercentage(batchTarget, batchAchieved) : null;

  // Calculations: Attendance
  const totalEmployees = attendanceRecords.length;
  const presentEmployees = attendanceRecords.filter((a) => a.status === 'Present').length;
  const absentEmployees = attendanceRecords.filter((a) => a.status === 'Absent').length;

  // Calculations: Vehicle Loading (Outgoing)
  const loadingVehiclesCount = loadingRecords.length;
  const loadingBoxes = loadingRecords.reduce((sum, v) => sum + (Number(v.boxes) || 0), 0);
  const loadingQuantity = loadingRecords.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  // Calculations: Vehicle Unloading (Incoming)
  const unloadingVehiclesCount = unloadingRecords.length;
  const unloadingBoxes = unloadingRecords.reduce((sum, v) => sum + (Number(v.boxes) || 0), 0);
  const unloadingQuantity = unloadingRecords.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <FileText size={24} style={{ color: 'var(--color-primary)' }} />
            <span>End-of-Day Production Summary</span>
          </h1>
          <p className="page-subtitle">
            Consolidated Shift Report for: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print / Save Summary
          </button>
        </div>
      </div>

      {/* Official Enterprise Document Container */}
      <div
        className="card"
        style={{
          maxWidth: '900px',
          margin: '0 auto 30px auto',
          boxShadow: 'var(--shadow-md)',
          border: '2px solid var(--color-border)'
        }}
      >
        {/* Document Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '2px solid var(--color-border)',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <img
                src="/logo.png"
                alt="Aditya Birla Lifestyle Brands"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#991b1b', letterSpacing: '0.06em' }}>
                ADITYA BIRLA GROUP • LIFESTYLE BRANDS
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em', color: 'var(--color-primary)' }}>
                REFINISHING DEPARTMENT PRODUCTION LOG
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Shift Timings: 8:30 AM – 5:00 PM (1 Shift Only) • Lunch: 12:30 PM – 1:00 PM
              </p>
            </div>
          </div>


          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-subtle)', fontWeight: '600' }}>
              REPORT DATE
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
              {formatDateDisplay(selectedDate)}
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div style={{ padding: '24px' }}>
          {/* Section 1: Hourly Scanning Production */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Scanning Production
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)' }}>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Target (Pcs)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {scanningTarget.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Achieved (Pcs)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                  {scanningAchieved.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Remaining (Pcs)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: scanningRemaining > 0 ? '#b91c1c' : '#15803d' }}>
                  {scanningRemaining.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Achievement</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: scanningPct >= 100 ? '#15803d' : '#0369a1' }}>
                  {scanningPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Batch Production */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <Layers size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Batch Production
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)' }}>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Batch Target (Pcs)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {batchTarget !== null ? batchTarget.toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Batch Achieved (Pcs)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                  {batchAchieved.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Remaining (Pcs)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {batchRemaining !== null ? batchRemaining.toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Achievement</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {batchPct !== null ? `${batchPct}%` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Attendance */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Daily Attendance
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)' }}>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Total Employees</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {totalEmployees}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Present</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#15803d' }}>
                  {presentEmployees}
                </div>
              </div>
              <div>
                <span className="stat-title" style={{ fontSize: '0.72rem' }}>Absent</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: absentEmployees > 0 ? '#b91c1c' : '#15803d' }}>
                  {absentEmployees}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Vehicle Loading & Unloading */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {/* Loading (Outward) */}
            <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '16px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ArrowUpFromLine size={16} style={{ color: '#15803d' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  4. Vehicle Loading (Outward)
                </h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <span className="stat-title" style={{ fontSize: '0.7rem' }}>Vehicles</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                    {loadingVehiclesCount}
                  </div>
                </div>
                <div>
                  <span className="stat-title" style={{ fontSize: '0.7rem' }}>Boxes</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                    {loadingBoxes.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="stat-title" style={{ fontSize: '0.7rem' }}>Quantity (Pcs)</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#15803d' }}>
                    {loadingQuantity.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Unloading (Inward) */}
            <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '16px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ArrowDownToLine size={16} style={{ color: '#0284c7' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  5. Vehicle Unloading (Inward)
                </h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <span className="stat-title" style={{ fontSize: '0.7rem' }}>Vehicles</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                    {unloadingVehiclesCount}
                  </div>
                </div>
                <div>
                  <span className="stat-title" style={{ fontSize: '0.7rem' }}>Boxes</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                    {unloadingBoxes.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="stat-title" style={{ fontSize: '0.7rem' }}>Quantity (Pcs)</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                    {unloadingQuantity.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* End-of-Day Sign-off Section */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '30px' }}>
                DATA ENTRY OPERATOR SIGNATURE:
              </div>
              <div style={{ borderBottom: '1px solid #475569', width: '80%' }}></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
                Name: {currentUser?.role === 'DATA ENTRY' ? currentUser.name : 'Ramesh Kumar (Operator)'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '30px' }}>
                SHIFT SUPERVISOR / HOD VERIFICATION:
              </div>
              <div style={{ borderBottom: '1px solid #475569', width: '80%' }}></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
                Name: {currentUser?.role === 'VIEWER' ? currentUser.name : 'Sunil Verma (Supervisor)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
