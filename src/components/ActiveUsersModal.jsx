import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Radio,
  Clock,
  Shield,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { seenService } from '../services/seenService';

const PAGE_NAMES = {
  'dashboard': 'Refinishing Dashboard',
  'daily-target': 'Daily Shift Target',
  'hourly-scanning': 'Hourly Scanning',
  'batch-production': 'Batch Production',
  'vehicle-loading': 'Vehicle Loading (Dispatch)',
  'vehicle-unloading': 'Vehicle Unloading (Inward)',
  'attendance': 'Employee Attendance',
  'seen-list': 'Seen & Audit Log',
  'daily-summary': 'Daily Summary Report'
};

export default function ActiveUsersModal({
  isOpen,
  onClose,
  onlineUsers = [],
  currentUser,
  selectedDate,
  onRefreshPresence
}) {
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'seen'
  const [todaySeen, setTodaySeen] = useState([]);
  const [loadingSeen, setLoadingSeen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSeenRecords();
    }
  }, [isOpen, selectedDate]);

  const loadSeenRecords = async () => {
    setLoadingSeen(true);
    try {
      const records = await seenService.getSeenRecords(selectedDate);
      setTodaySeen(records);
    } catch (e) {
      console.warn('Error loading seen records in modal:', e);
    } finally {
      setLoadingSeen(false);
    }
  };

  if (!isOpen) return null;

  // Deduplicate online users by userId
  const uniqueOnlineUsers = [];
  const seenUserIds = new Set();
  (onlineUsers || []).forEach((u) => {
    if (!seenUserIds.has(u.userId)) {
      seenUserIds.add(u.userId);
      uniqueOnlineUsers.push(u);
    }
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container active-users-modal"
        style={{ maxWidth: '580px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Radio size={20} className="pulse-icon" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--color-primary)' }}>
                Active Users on Web
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', margin: 0 }}>
                Real-time presence & who is viewing data right now
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onRefreshPresence && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onRefreshPresence}
                title="Refresh presence"
                style={{ padding: '4px 8px' }}
              >
                <RefreshCw size={14} />
              </button>
            )}
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '8px 20px 0 20px',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: '#f8fafc',
            gap: '12px'
          }}
        >
          <button
            type="button"
            className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
            onClick={() => setActiveTab('online')}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'online' ? '600' : '500',
              color: activeTab === 'online' ? 'var(--color-primary)' : 'var(--color-text-subtle)',
              borderBottom: activeTab === 'online' ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}
            />
            <span>Online Now ({uniqueOnlineUsers.length})</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'seen' ? 'active' : ''}`}
            onClick={() => setActiveTab('seen')}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'seen' ? '600' : '500',
              color: activeTab === 'seen' ? 'var(--color-primary)' : 'var(--color-text-subtle)',
              borderBottom: activeTab === 'seen' ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={14} />
            <span>Today's Viewers ({todaySeen.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '380px', overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'online' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                  Connected sessions syncing live:
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}
                >
                  ● Live Sync Active
                </span>
              </div>

              {uniqueOnlineUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-subtle)' }}>
                  <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No other active users detected.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {uniqueOnlineUsers.map((user) => {
                    const isSelf = user.userId === currentUser?.id;
                    const pageTitle = PAGE_NAMES[user.page] || 'Viewing Data';

                    return (
                      <div
                        key={user.userId || user.tabId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          borderRadius: '8px',
                          border: isSelf ? '1.5px solid #93c5fd' : '1px solid var(--color-border-subtle)',
                          backgroundColor: isSelf ? '#eff6ff' : '#ffffff',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Avatar with pulse status dot */}
                          <div style={{ position: 'relative' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: user.role === 'DATA ENTRY' ? '#1e3a8a' : '#d97706',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '0.95rem'
                              }}
                            >
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                border: '2px solid #ffffff'
                              }}
                              title="Online right now"
                            />
                          </div>

                          {/* User details */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0f172a' }}>
                                {user.name}
                              </span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    fontWeight: '600'
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                              <span
                                className={`badge badge-role ${user.role !== 'DATA ENTRY' ? 'viewer' : ''}`}
                                style={{ padding: '1px 6px', fontSize: '0.65rem' }}
                              >
                                {user.role}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                                {user.department}
                              </span>
                            </div>

                            {/* Current active location */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '4px',
                                fontSize: '0.75rem',
                                color: '#2563eb'
                              }}
                            >
                              <span style={{ color: '#059669' }}>● Active on:</span>
                              <strong>{pageTitle}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Status label */}
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              color: '#059669',
                              fontWeight: '600'
                            }}
                          >
                            Online Now
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'seen' && (
            <div>
              <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                Audited & verified views recorded on {selectedDate}:
              </div>

              {loadingSeen ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-subtle)' }}>
                  Loading seen records...
                </div>
              ) : todaySeen.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-subtle)' }}>
                  <Eye size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No supervisor audit logs recorded for this date yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {todaySeen.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Eye size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{s.viewerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                            {s.module} {s.hour ? `• Slot: ${s.hour}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                        {new Date(s.viewedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
            Data updates auto-sync instantly across all viewers.
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
