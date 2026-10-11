/**
 * Production and Performance Calculation Utilities
 */

/**
 * Calculate Remaining: Target - Achieved
 */
export function calculateRemaining(target, achieved) {
  const t = Number(target) || 0;
  const a = Number(achieved) || 0;
  const rem = t - a;
  return rem > 0 ? rem : 0;
}

/**
 * Calculate Difference: Achieved - Target
 */
export function calculateDifference(target, achieved) {
  const t = Number(target) || 0;
  const a = Number(achieved) || 0;
  return a - t;
}

/**
 * Calculate Achievement Percentage: (Achieved / Target) * 100
 */
export function calculateAchievementPercentage(target, achieved) {
  const t = Number(target) || 0;
  const a = Number(achieved) || 0;
  if (t <= 0) return 0;
  const pct = (a / t) * 100;
  return Number(pct.toFixed(1));
}

/**
 * Determine Production Status:
 * - 'Not Updated'
 * - 'Below Target'
 * - 'On Target'
 * - 'Above Target'
 */
export function calculateProductionStatus(target, achieved, isExplicitlyUpdated = true) {
  const t = Number(target) || 0;
  const a = Number(achieved) || 0;

  if (!isExplicitlyUpdated || (t === 0 && a === 0)) {
    return 'Not Updated';
  }

  if (a < t) {
    return 'Below Target';
  } else if (a === t) {
    return 'On Target';
  } else {
    return 'Above Target';
  }
}

/**
 * Status color and styling metadata for standard badges
 */
export function getStatusBadgeMeta(status) {
  switch (status) {
    case 'Above Target':
      return {
        label: 'Above Target',
        className: 'badge-status-above',
        bg: '#dcfce7',
        color: '#15803d',
        border: '#86efac'
      };
    case 'On Target':
      return {
        label: 'On Target',
        className: 'badge-status-on',
        bg: '#e0f2fe',
        color: '#0369a1',
        border: '#7dd3fc'
      };
    case 'Below Target':
      return {
        label: 'Below Target',
        className: 'badge-status-below',
        bg: '#fee2e2',
        color: '#b91c1c',
        border: '#fca5a5'
      };
    case 'Not Updated':
    default:
      return {
        label: 'Not Updated',
        className: 'badge-status-pending',
        bg: '#f1f5f9',
        color: '#64748b',
        border: '#cbd5e1'
      };
  }
}
