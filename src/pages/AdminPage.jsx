/**
 * Admin Dashboard & User Management Page
 * - Tabs: Overview | User Management | Roles & Permissions | Audit Log
 * - All write operations go through adminService which re-verifies role in DB
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Lock,
  Eye,
  Filter,
  MoreVertical,
  Shield,
  FileText,
  Key,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { adminService } from '../services/adminService';
import { formatDateDisplay } from '../utils/dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROLES = ['ADMIN', 'DATA ENTRY', 'VIEWER'];

const ROLE_DESCRIPTIONS = {
  ADMIN: {
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    label: 'Administrator',
    permissions: [
      'Manage authorized user accounts and roles',
      'Access all dashboards, reports, and production data',
      'Review administrative audit logs',
      'Activate and deactivate user accounts',
      'Change user roles and departments'
    ]
  },
  'DATA ENTRY': {
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    label: 'Data Entry',
    permissions: [
      'Set and update daily production targets',
      'Enter and update hourly scanning production',
      'Record batch production data',
      'Log vehicle loading and unloading',
      'Maintain daily attendance records'
    ]
  },
  VIEWER: {
    color: '#92400e',
    bg: '#fef3c7',
    border: '#fde68a',
    label: 'Viewer / Supervisor / HOD',
    permissions: [
      'View production information and reports',
      'Access notifications and attendance records',
      'Use the Seen List functionality',
      'Read-only access to all modules',
      'Cannot modify production data or manage users'
    ]
  }
};

const EMPTY_FORM = {
  name: '',
  username: '',
  email: '',
  employee_id: '',
  role: 'DATA ENTRY',
  department: 'Refinishing Dept'
};

// ─────────────────────────────────────────────────────────────────────────────
// Role Badge Component
// ─────────────────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const config = ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.VIEWER;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: '0.72rem',
        fontWeight: '700',
        borderRadius: '4px',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        letterSpacing: '0.03em'
      }}
    >
      {role === 'ADMIN' && <Shield size={10} />}
      {role}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: '0.72rem',
        fontWeight: '600',
        borderRadius: '4px',
        backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
        color: isActive ? '#166534' : '#475569',
        border: `1px solid ${isActive ? '#86efac' : '#cbd5e1'}`
      }}
    >
      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Dialog Component
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: danger ? '#dc2626' : 'var(--color-primary)' }}>
          <AlertTriangle size={18} />
          {title}
        </span>
      }
      maxWidth="420px"
      footer={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{message}</p>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback Message Component
// ─────────────────────────────────────────────────────────────────────────────

function FeedbackMessage({ type, message, onDismiss }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '6px',
        marginBottom: '16px',
        backgroundColor: isError ? '#fee2e2' : '#dcfce7',
        border: `1px solid ${isError ? '#fca5a5' : '#86efac'}`,
        color: isError ? '#991b1b' : '#166534',
        fontSize: '0.875rem'
      }}
      role="alert"
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isError ? <XCircle size={16} /> : <CheckCircle size={16} />}
        {message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Form Modal
// ─────────────────────────────────────────────────────────────────────────────

function UserFormModal({ isOpen, onClose, onSave, initialData, mode, loading, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const isEdit = mode === 'edit';
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEdit ? <Edit3 size={18} /> : <UserPlus size={18} />}
          {isEdit ? 'Edit User Account' : 'Create New User Account'}
        </span>
      }
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            type="submit"
            form="user-form"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      }
    >
      {error && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <XCircle size={15} /> {error}
        </div>
      )}
      <form id="user-form" onSubmit={handleSubmit}>
        <div className="form-row" style={{ marginBottom: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-user-name">Full Name *</label>
            <input
              id="admin-user-name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-user-empid">Employee ID</label>
            <input
              id="admin-user-empid"
              type="text"
              className="form-control"
              value={form.employee_id}
              onChange={e => handleChange('employee_id', e.target.value)}
              placeholder="e.g. EMP-26"
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-user-username">Username / Login ID *</label>
            <input
              id="admin-user-username"
              type="text"
              className="form-control"
              value={form.username}
              onChange={e => handleChange('username', e.target.value.toLowerCase())}
              placeholder="e.g. rajesh.sharma"
              required
              readOnly={isEdit}
              style={isEdit ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
            />
            {isEdit && (
              <span className="form-hint">Username cannot be changed after creation.</span>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-user-email">Email (optional)</label>
            <input
              id="admin-user-email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="e.g. rajesh@company.com"
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-user-role">Role *</label>
            <select
              id="admin-user-role"
              className="form-control"
              value={form.role}
              onChange={e => handleChange('role', e.target.value)}
              required
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r === 'DATA ENTRY' ? 'Data Entry' : r === 'ADMIN' ? 'Administrator' : 'Viewer / Supervisor / HOD'}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-user-dept">Department</label>
            <input
              id="admin-user-dept"
              type="text"
              className="form-control"
              value={form.department}
              onChange={e => handleChange('department', e.target.value)}
              placeholder="e.g. Refinishing Dept"
            />
          </div>
        </div>

        {!isEdit && (
          <div
            style={{
              padding: '10px 14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#1e3a8a',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              After creating this account, share the username with the user. Their initial password will be set by the system administrator separately (Supabase Auth or manual credential assignment).
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Admin Overview
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({ stats, users, onlineUsers, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-subtle)' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <div>Loading overview…</div>
      </div>
    );
  }

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  return (
    <div>
      {/* KPI Stats */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          subtext="All registered accounts"
        />
        <StatCard
          title="Active Accounts"
          value={stats.active}
          icon={UserCheck}
          subtext="Currently enabled"
          progress={stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}
          progressColor="green"
        />
        <StatCard
          title="Inactive Accounts"
          value={stats.inactive}
          icon={UserX}
          subtext="Deactivated"
        />
        <StatCard
          title="Currently Online"
          value={onlineUsers.length}
          icon={Activity}
          subtext="Live presence"
        />
      </div>

      <div className="grid-cols-2">
        {/* Role Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Shield size={16} /> Users by Role</span>
          </div>
          <div className="card-body">
            {ROLES.map(role => {
              const count = stats.byRole?.[role] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const config = ROLE_DESCRIPTIONS[role];
              return (
                <div key={role} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <RoleBadge role={role} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
                      {count} user{count !== 1 ? 's' : ''} <span style={{ color: 'var(--color-text-subtle)', fontWeight: '400' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: config.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recently Added */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Clock size={16} /> Recently Added Users</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Last 5 accounts</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentUsers.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>No users found in database.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{u.name || u.username || u.id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>{u.username || '—'}</div>
                      </td>
                      <td><RoleBadge role={u.role || 'VIEWER'} /></td>
                      <td><ActiveBadge isActive={u.is_active !== false} /></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {u.created_at ? formatDateDisplay(u.created_at.split('T')[0]) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Currently Online */}
      {onlineUsers.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <span className="card-title">
              <span className="live-pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', marginRight: '6px', animation: 'pulse 2s infinite' }} />
              Currently Online — {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {onlineUsers.map((u, i) => (
              <div
                key={u.tabId || u.userId || i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#1e3a8a', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '0.75rem', flexShrink: 0
                }}>
                  {(u.name || 'U').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{u.name || u.username}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                    {u.role} · {u.page || 'dashboard'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: User Management
// ─────────────────────────────────────────────────────────────────────────────

function UserManagementTab({ users, currentUser, loading, onRefresh, feedback, onDismissFeedback }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(null); // { type, user }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.employee_id || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const isActive = u.is_active !== false;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const openCreate = () => {
    setSelectedUser(null);
    setFormError('');
    setModalMode('create');
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormError('');
    setModalMode('edit');
    setOpenMenuId(null);
  };

  const handleSaveUser = async (formData) => {
    setFormLoading(true);
    setFormError('');
    let result;
    if (modalMode === 'create') {
      result = await adminService.createUser(currentUser, formData);
    } else {
      result = await adminService.updateUser(currentUser, selectedUser.id, formData);
    }
    setFormLoading(false);
    if (result.success) {
      setModalMode(null);
      onRefresh('success', modalMode === 'create' ? 'User account created successfully.' : 'User account updated successfully.');
    } else {
      setFormError(result.error);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    let result;

    if (confirm.type === 'deactivate') {
      result = await adminService.setUserActiveStatus(currentUser, confirm.user.id, false);
    } else if (confirm.type === 'activate') {
      result = await adminService.setUserActiveStatus(currentUser, confirm.user.id, true);
    } else if (confirm.type === 'delete') {
      result = await adminService.deleteUser(currentUser, confirm.user.id);
    }

    setConfirmLoading(false);
    if (result?.success) {
      setConfirm(null);
      onRefresh('success',
        confirm.type === 'deactivate' ? 'Account deactivated. Historical records preserved.' :
        confirm.type === 'activate' ? 'Account reactivated successfully.' :
        'User account permanently deleted.'
      );
    } else {
      setConfirm(null);
      onRefresh('error', result?.error || 'Operation failed.');
    }
  };

  return (
    <div>
      {feedback.message && (
        <FeedbackMessage type={feedback.type} message={feedback.message} onDismiss={onDismissFeedback} />
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
            <input
              id="admin-user-search"
              type="text"
              className="form-control"
              placeholder="Search name, username, employee ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>

          {/* Role Filter */}
          <select
            id="admin-role-filter"
            className="form-control"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="ALL">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Status Filter */}
          <select
            id="admin-status-filter"
            className="form-control"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onRefresh()}
            disabled={loading}
            id="admin-refresh-users"
          >
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreate}
            id="admin-create-user"
          >
            <UserPlus size={14} />
            New User
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginBottom: '10px' }}>
        Showing {filtered.length} of {users.length} users
      </div>

      {/* User Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Employee ID</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Login</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-subtle)' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                  <div>Loading users…</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <Users size={32} />
                    <p style={{ marginTop: '8px' }}>No users match your search criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(u => {
                const isActive = u.is_active !== false;
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: isActive ? '#1e3a8a' : '#94a3b8',
                          color: '#fff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem', flexShrink: 0
                        }}>
                          {(u.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                            {u.name || '—'}
                            {isSelf && (
                              <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '1px 5px' }}>You</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                            {u.username || '—'}{u.email ? ` · ${u.email}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{u.employee_id || '—'}</td>
                    <td><RoleBadge role={u.role || 'VIEWER'} /></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{u.department || '—'}</td>
                    <td><ActiveBadge isActive={isActive} /></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                      {u.created_at ? formatDateDisplay(u.created_at.split('T')[0]) : '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                      {u.last_login_at ? formatDateDisplay(u.last_login_at.split('T')[0]) : 'Never'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        {/* Edit */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => openEdit(u)}
                          title="Edit user"
                          id={`admin-edit-${u.id}`}
                        >
                          <Edit3 size={13} />
                        </button>

                        {/* Toggle active */}
                        {!isSelf && (
                          <button
                            type="button"
                            className={`btn btn-sm btn-icon ${isActive ? 'btn-secondary' : 'btn-success'}`}
                            onClick={() => setConfirm({ type: isActive ? 'deactivate' : 'activate', user: u })}
                            title={isActive ? 'Deactivate account' : 'Reactivate account'}
                            id={`admin-toggle-${u.id}`}
                          >
                            {isActive ? <ToggleRight size={13} style={{ color: '#16a34a' }} /> : <ToggleLeft size={13} />}
                          </button>
                        )}

                        {/* Delete */}
                        {!isSelf && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => setConfirm({ type: 'delete', user: u })}
                            title="Permanently delete user"
                            id={`admin-delete-${u.id}`}
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        onSave={handleSaveUser}
        initialData={selectedUser}
        mode={modalMode}
        loading={formLoading}
        error={formError}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirm?.type === 'deactivate'}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirmAction}
        title="Deactivate Account"
        message={`Deactivate the account for "${confirm?.user?.name || confirm?.user?.username}"? They will lose access immediately. All historical production records will be preserved. You can reactivate this account at any time.`}
        confirmLabel="Deactivate"
        danger={false}
        loading={confirmLoading}
      />
      <ConfirmDialog
        isOpen={confirm?.type === 'activate'}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirmAction}
        title="Reactivate Account"
        message={`Reactivate the account for "${confirm?.user?.name || confirm?.user?.username}"? They will regain access with their existing role and permissions.`}
        confirmLabel="Reactivate"
        danger={false}
        loading={confirmLoading}
      />
      <ConfirmDialog
        isOpen={confirm?.type === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirmAction}
        title="Permanently Delete User"
        message={`Permanently delete the account for "${confirm?.user?.name || confirm?.user?.username}"? This CANNOT be undone. Their historical production records will remain intact. Consider deactivating instead.`}
        confirmLabel="Delete Permanently"
        danger={true}
        loading={confirmLoading}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Roles & Permissions
// ─────────────────────────────────────────────────────────────────────────────

function RolesTab() {
  return (
    <div>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
        The following roles define the level of access within the Refinishing Department application.
        Role assignments are enforced at the service layer and verified against the database on every privileged operation.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {ROLES.map(role => {
          const config = ROLE_DESCRIPTIONS[role];
          return (
            <div key={role} className="card" style={{ marginBottom: 0, borderLeft: `4px solid ${config.color}` }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {role === 'ADMIN' ? <Shield size={18} style={{ color: config.color }} /> :
                     role === 'DATA ENTRY' ? <Edit3 size={18} style={{ color: config.color }} /> :
                     <Eye size={18} style={{ color: config.color }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text-main)' }}>{config.label}</div>
                    <RoleBadge role={role} />
                  </div>
                </div>
              </div>
              <div className="card-body">
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {config.permissions.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      <CheckCircle size={14} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '20px', padding: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.85rem', color: '#1e3a8a' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Lock size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Security Note:</strong> Role checks are performed server-side on every administrative write operation.
            Frontend role values (localStorage) are used for UI display only and are never the sole authority for data access.
            Deactivated accounts cannot perform any protected operations even if a session token is still present.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Audit Log
// ─────────────────────────────────────────────────────────────────────────────

function AuditLogTab({ loading }) {
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const loadLogs = useCallback(async () => {
    setLogLoading(true);
    const data = await adminService.getAuditLog(PAGE_SIZE, page * PAGE_SIZE);
    setLogs(data);
    setLogLoading(false);
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const ACTION_COLORS = {
    CREATE_USER:    { bg: '#dcfce7', color: '#166534' },
    UPDATE_USER:    { bg: '#eff6ff', color: '#1d4ed8' },
    CHANGE_ROLE:    { bg: '#f3e8ff', color: '#6b21a8' },
    DEACTIVATE_USER:{ bg: '#fef3c7', color: '#92400e' },
    REACTIVATE_USER:{ bg: '#dcfce7', color: '#166534' },
    DELETE_USER:    { bg: '#fee2e2', color: '#991b1b' }
  };

  const getActionStyle = (action) => ACTION_COLORS[action] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-subtle)' }}>
          Append-only audit trail of all administrative actions. Records cannot be modified or deleted.
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadLogs}
          disabled={logLoading}
          id="admin-refresh-audit"
        >
          <RefreshCw size={13} style={logLoading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Performed By</th>
              <th>Action</th>
              <th>Affected User</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-subtle)' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <FileText size={32} />
                    <p style={{ marginTop: '8px' }}>No audit records yet. Admin actions will appear here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const style = getActionStyle(log.action);
                const ts = log.performed_at ? new Date(log.performed_at) : null;
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {ts ? (
                        <>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                            {ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ color: 'var(--color-text-subtle)' }}>
                            {ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{log.performed_by || '—'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '0.03em',
                        background: style.bg,
                        color: style.color
                      }}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{log.affected_user || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', maxWidth: '240px' }}>
                      {log.notes || '—'}
                      {log.new_value && (
                        <div style={{ marginTop: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
                          {JSON.stringify(log.new_value)}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!logLoading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >← Previous</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            Page {page + 1}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < PAGE_SIZE}
          >Next →</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminPage Component
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',    label: 'Overview',       icon: Activity },
  { id: 'users',       label: 'User Management', icon: Users },
  { id: 'roles',       label: 'Roles & Permissions', icon: Shield },
  { id: 'audit',       label: 'Audit Log',       icon: FileText }
];

export default function AdminPage({ currentUser, onlineUsers = [] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, byRole: {}, recentlyAdded: 0 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Guard: only ADMIN role can access this page
  const isAdmin = currentUser?.role === 'ADMIN';

  const loadData = useCallback(async (feedbackType, feedbackMsg) => {
    setLoading(true);
    try {
      const [allUsers, dashStats] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getDashboardStats()
      ]);
      setUsers(allUsers);
      setStats(dashStats);
    } catch (err) {
      console.error('AdminPage load error:', err);
    } finally {
      setLoading(false);
    }
    if (feedbackType && feedbackMsg) {
      setFeedback({ type: feedbackType, message: feedbackMsg });
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  // Redirect non-admins
  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: '16px',
        textAlign: 'center', color: 'var(--color-text-subtle)'
      }}>
        <Lock size={48} style={{ color: '#dc2626' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
          Access Restricted
        </h2>
        <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>
          The Admin Dashboard is only accessible to users with the <strong>ADMIN</strong> role.
          Contact your administrator to request elevated access.
        </p>
        <div style={{ padding: '8px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.85rem', color: '#991b1b' }}>
          Current role: <strong>{currentUser?.role || 'UNKNOWN'}</strong>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <ShieldCheck size={22} style={{ color: '#dc2626' }} />
            Admin Dashboard
          </h1>
          <div className="page-subtitle">
            User management, role assignments, and administrative audit trail
          </div>
        </div>
        <div className="page-actions">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: '6px', fontSize: '0.8rem', color: '#991b1b', fontWeight: '600'
          }}>
            <Shield size={13} />
            Administrator Session
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '2px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        {TABS.map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#1e3a8a' : 'var(--color-text-subtle)',
                background: isActive ? '#eff6ff' : 'transparent',
                border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComp size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          stats={stats}
          users={users}
          onlineUsers={onlineUsers}
          loading={loading}
        />
      )}

      {activeTab === 'users' && (
        <UserManagementTab
          users={users}
          currentUser={currentUser}
          loading={loading}
          onRefresh={(type, msg) => loadData(type, msg)}
          feedback={feedback}
          onDismissFeedback={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {activeTab === 'roles' && <RolesTab />}

      {activeTab === 'audit' && <AuditLogTab loading={loading} />}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
