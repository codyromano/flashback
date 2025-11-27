import React, { useEffect } from 'react';
import './RecordingsList.css';
import { RecordingItem } from './RecordingItem';

export function RecordingsList({ 
  recordings, 
  loading, 
  error, 
  onPlay, 
  onRename, 
  onToggleFavorite, 
  onDelete,
  onLoad,
  playingId
}) {
  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  if (loading) {
    return (
      <div className="recordings-list">
        <div className="loading-container">
          <div className="spinner" />
          <p className="text-muted">Loading recordings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recordings-list">
        <div className="error-container">
          <p className="text-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="recordings-list">
        <div className="empty-state">
          <p className="text-muted">No recordings yet</p>
          <p className="text-muted" style={{ fontSize: '12px' }}>
            Tap the record button to capture audio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recordings-list">
      <h2 className="recordings-title">Your Recordings</h2>
      <div className="recordings-grid">
        {recordings.map((recording) => (
          <RecordingItem
            key={recording.id}
            recording={recording}
            onPlay={onPlay}
            onRename={onRename}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
            isPlaying={playingId === recording.id}
          />
        ))}
      </div>
    </div>
  );
}
