import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import Modal from '../components/Modal';
import { attendanceService } from '../services/attendanceService';
import { formatDateDisplay } from '../utils/dateUtils';

export default function AttendancePage({ selectedDate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [attendanceList, setAttendanceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ id: '', name: '', status: 'Present' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const isDataEntry = currentUser?.role === 'DATA ENTRY';

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getAttendance(selectedDate);
      setAttendanceList(data);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (record) => {
    if (!isDataEntry) return;

    const newStatus = record.status === 'Present' ? 'Absent' : 'Present';
    try {
      await attendanceService.saveAttendance({
        date: selectedDate,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        status: newStatus,
        user: currentUser
      });

      // Update local state instantly
      setAttendanceList((prev) =>
        prev.map((item) =>
          item.employeeId === record.employeeId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update attendance status.' });
    }
  };

  const handleBulkMark = async (targetStatus) => {
    if (!isDataEntry) return;
    if (window.confirm(`Mark all employees as ${targetStatus} for ${formatDateDisplay(selectedDate)}?`)) {
      setSaving(true);
      try {
        const updated = await attendanceService.bulkUpdateStatus(selectedDate, targetStatus, currentUser);
        setAttendanceList(updated);
        setMessage({
          type: 'success',
          text: `All ${updated.length} employees marked ${targetStatus}.`
        });
      } catch (err) {
        setMessage({ type: 'error', text: 'Bulk attendance update failed.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!isDataEntry) return;

    if (!newEmployee.id.trim() || !newEmployee.name.trim()) {
      alert('Employee ID and Name are required.');
      return;
    }

    setSaving(true);
    try {
      await attendanceService.addEmployee(
        selectedDate,
        newEmployee.id.trim().toUpperCase(),
        newEmployee.name.trim(),
        newEmployee.status,
        currentUser
      );
      setIsAddModalOpen(false);
      setNewEmployee({ id: '', name: '', status: 'Present' });
      setMessage({
        type: 'success',
        text: `Employee ${newEmployee.name} added to roster for ${formatDateDisplay(selectedDate)}.`
      });
      loadAttendance();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add employee.' });
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalEmployees = attendanceList.length;
  const presentCount = attendanceList.filter((a) => a.status === 'Present').length;
  const absentCount = attendanceList.filter((a) => a.status === 'Absent').length;
  const attendanceRate = totalEmployees > 0 ? ((presentCount / totalEmployees) * 100).toFixed(1) : 0;

  // Filtered employees
  const filteredList = attendanceList.filter((emp) => {
    const matchesSearch =
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Users size={24} style={{ color: 'var(--color-primary)' }} />
            <span>Daily Shift Attendance Register</span>
          </h1>
          <p className="page-subtitle">
            Manpower Roster • Date: <strong>{formatDateDisplay(selectedDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          {isDataEntry && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleBulkMark('Present')}
                disabled={saving}
              >
                Mark All Present
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} />
                Add Employee to Roster
              </button>
            </>
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

      {/* KPI Cards: Manpower Attendance */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-title">Total Roster</span>
          <div className="stat-value">{totalEmployees}</div>
          <span className="stat-meta">Active workforce today</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Present On Shift</span>
          <div className="stat-value" style={{ color: '#15803d' }}>
            {presentCount}
          </div>
          <span className="stat-meta">Operating lines & prep</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Absent</span>
          <div className="stat-value" style={{ color: absentCount > 0 ? '#b91c1c' : '#15803d' }}>
            {absentCount}
          </div>
          <span className="stat-meta">Unaccounted or leave</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Attendance Rate</span>
          <div className="stat-value">{attendanceRate}%</div>
          <div className="progress-track">
            <div
              className="progress-fill green"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Table & Filter Controls */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <span className="card-title">
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
            Employee Roster for {formatDateDisplay(selectedDate)}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '200px' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '32px', height: '32px', fontSize: '0.8rem' }}
                placeholder="Search name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }}
              />
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '4px 10px', height: '32px' }}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({totalEmployees})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'Present' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '4px 10px', height: '32px' }}
                onClick={() => setStatusFilter('Present')}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'Absent' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '4px 10px', height: '32px' }}
                onClick={() => setStatusFilter('Absent')}
              >
                Absent ({absentCount})
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>#</th>
                <th style={{ width: '150px' }}>Employee ID</th>
                <th>Employee Name</th>
                <th style={{ width: '140px' }}>Status</th>
                <th style={{ width: '160px' }}>Last Updated</th>
                {isDataEntry && <th style={{ textAlign: 'center', width: '130px' }}>Toggle Status</th>}
              </tr>
            </thead>
            <tbody>
              {filteredList.length > 0 ? (
                filteredList.map((emp, index) => {
                  const isPresent = emp.status === 'Present';
                  return (
                    <tr key={emp.id || emp.employeeId}>
                      <td style={{ color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>
                        {index + 1}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                        {emp.employeeId}
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        {emp.employeeName}
                      </td>
                      <td>
                        <span
                          className={`badge ${isPresent ? 'badge-status-above' : 'badge-status-below'}`}
                          style={{ minWidth: '70px', justifyContent: 'center' }}
                        >
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                        {emp.updatedAt ? new Date(emp.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30 AM'}
                      </td>
                      {isDataEntry && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isPresent ? 'btn-secondary' : 'btn-success'}`}
                            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleToggleStatus(emp)}
                          >
                            {isPresent ? (
                              <>
                                <UserX size={13} style={{ color: '#dc2626' }} />
                                Set Absent
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                Set Present
                              </>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isDataEntry ? 6 : 5} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--color-text-subtle)' }}>
                      No matching employee records found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: '700', borderTop: '2px solid var(--color-border)' }}>
                <td colSpan={3}>TOTAL EMPLOYEES: {totalEmployees}</td>
                <td style={{ color: '#15803d' }}>PRESENT: {presentCount}</td>
                <td style={{ color: '#b91c1c' }}>ABSENT: {absentCount}</td>
                {isDataEntry && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Add Employee */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Employee to Daily Roster"
        >
          <form onSubmit={handleAddEmployee}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-emp-id">Employee ID *</label>
              <input
                id="new-emp-id"
                type="text"
                className="form-control"
                placeholder="e.g. EMP-26"
                value={newEmployee.id}
                onChange={(e) => setNewEmployee({ ...newEmployee, id: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-emp-name">Employee Full Name *</label>
              <input
                id="new-emp-name"
                type="text"
                className="form-control"
                placeholder="e.g. Rajesh Shrivastav"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-emp-status">Initial Shift Status</label>
              <select
                id="new-emp-status"
                className="form-control"
                value={newEmployee.status}
                onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Adding...' : 'Add to Roster'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
