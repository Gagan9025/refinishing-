import React, { useState } from 'react';
import { Sliders, Lock, User, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('entry');
  const [password, setPassword] = useState('entry123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(username, password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="login-page-wrapper">
      {/* Official Background Watermark */}
      <div className="login-bg-watermark">
        <img src="/logo.png" alt="" aria-hidden="true" />
      </div>

      <div className="login-card">
        {/* Header with Official Logo */}
        <div className="login-header">
          <div className="login-logo-container">
            <img
              src="/logo.png"
              alt="Aditya Birla Lifestyle Brands Logo"
              className="login-official-logo"
            />
          </div>
          <h2>ADITYA BIRLA</h2>
          <p style={{ fontWeight: '600', color: '#fed7aa', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
            Lifestyle Brands • Refinishing Dept
          </p>
          <p style={{ fontSize: '0.78rem', color: '#bfdbfe', marginTop: '2px' }}>
            Daily Production Management Portal (8:30 AM – 5:00 PM)
          </p>
        </div>


        {/* Body */}
        <div className="login-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-username"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
                <User
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Production Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="demo-account-box">
            <div className="demo-account-title">
              <span>Demo Quick-Fill Roles (Stage 1 Testing)</span>
            </div>
            <div className="demo-btn-group" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <button
                type="button"
                className="btn-demo-select"
                onClick={() => handleSelectDemo('admin', 'admin123')}
                id="demo-select-admin"
              >
                <div style={{ color: '#dc2626' }}>ADMIN</div>
                <small>admin / admin123</small>
                <small style={{ color: '#dc2626' }}>User Management</small>
              </button>

              <button
                type="button"
                className="btn-demo-select"
                onClick={() => handleSelectDemo('entry', 'entry123')}
                id="demo-select-entry"
              >
                <div>DATA ENTRY</div>
                <small>entry / entry123</small>
                <small style={{ color: '#0284c7' }}>Full Add/Edit/Update</small>
              </button>

              <button
                type="button"
                className="btn-demo-select"
                onClick={() => handleSelectDemo('viewer', 'viewer123')}
                id="demo-select-viewer"
              >
                <div>VIEWER</div>
                <small>viewer / viewer123</small>
                <small style={{ color: '#d97706' }}>Audit & View-Only</small>
              </button>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '18px',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}
          >
            Refinishing Line 1 • General Shift (8:30 AM – 5:00 PM)
          </div>
        </div>
      </div>
    </div>
  );
}
