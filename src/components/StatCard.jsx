import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  progress,
  progressColor = 'blue'
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-value">{value}</div>

      {progress !== undefined && progress !== null && (
        <div className="progress-track" title={`Achievement: ${progress}%`}>
          <div
            className={`progress-fill ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, Number(progress)))}%` }}
          />
        </div>
      )}

      {(subtext || badge) && (
        <div className="stat-meta" style={{ marginTop: progress !== undefined ? '8px' : '0' }}>
          {badge}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
}
