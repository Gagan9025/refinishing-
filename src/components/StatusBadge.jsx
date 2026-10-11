import React from 'react';
import { getStatusBadgeMeta } from '../utils/calculationUtils';

export default function StatusBadge({ status }) {
  const meta = getStatusBadgeMeta(status);

  return (
    <span
      className={`badge ${meta.className}`}
      title={`Production Status: ${meta.label}`}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: meta.color,
          display: 'inline-block'
        }}
      />
      {meta.label}
    </span>
  );
}
