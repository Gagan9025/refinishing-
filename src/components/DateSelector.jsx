import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatDateDisplay, getPreviousDay, getNextDay, getInitialSelectedDate, formatDateToISO } from '../utils/dateUtils';

export default function DateSelector({ selectedDate, onDateChange }) {
  const handlePrev = () => {
    onDateChange(getPreviousDay(selectedDate));
  };

  const handleNext = () => {
    onDateChange(getNextDay(selectedDate));
  };

  const handleToday = () => {
    onDateChange(formatDateToISO(new Date()));
  };

  const handlePickerChange = (e) => {
    if (e.target.value) {
      onDateChange(e.target.value);
    }
  };

  return (
    <div className="date-selector-bar">
      <button
        type="button"
        className="date-nav-btn"
        onClick={handlePrev}
        title="Previous Day"
        aria-label="Previous Day"
      >
        <ChevronLeft size={16} />
      </button>

      <label className="date-label-btn" title="Click to select specific date">
        <Calendar size={15} style={{ color: 'var(--color-accent)' }} />
        <span>{formatDateDisplay(selectedDate)}</span>
        <input
          type="date"
          value={selectedDate}
          onChange={handlePickerChange}
          className="date-picker-input"
          style={{ width: '22px', opacity: 0, position: 'absolute', cursor: 'pointer' }}
          title="Choose date"
        />
      </label>

      <button
        type="button"
        className="date-nav-btn"
        onClick={handleNext}
        title="Next Day"
        aria-label="Next Day"
      >
        <ChevronRight size={16} />
      </button>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ padding: '3px 8px', fontSize: '0.75rem', height: '26px' }}
        onClick={handleToday}
        title="Jump to Today's Shift Date"
      >
        <RotateCcw size={12} />
        <span className="desktop-only" style={{ marginLeft: '2px' }}>Today</span>
      </button>
    </div>
  );
}

