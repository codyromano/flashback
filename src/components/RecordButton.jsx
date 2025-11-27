import React from 'react';
import './RecordButton.css';

export function RecordButton({ isRecording, isBuffering, onToggle, disabled }) {
  return (
    <div className="record-button-container">
      <button
        className={`record-button ${isRecording ? 'recording' : ''} ${!isBuffering ? 'disabled' : ''}`}
        onClick={onToggle}
        disabled={disabled || !isBuffering}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        data-testid="record-btn"
      >
        <div className="record-button-inner">
          {isRecording ? (
            <div className="stop-icon" />
          ) : (
            <div className="record-icon" />
          )}
        </div>
        <div className="ripple" />
      </button>
      <p className="record-button-hint">
        {!isBuffering ? 'Initializing...' : isRecording ? 'Tap to stop' : 'Tap to capture last 15s'}
      </p>
    </div>
  );
}
