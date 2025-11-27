import React, { useState } from 'react';
import './RecordingItem.css';

export function RecordingItem({ 
  recording, 
  onPlay, 
  onRename, 
  onToggleFavorite, 
  onDelete, 
  isPlaying 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(recording.name);
  // Remove confirmation state

  const handleRename = () => {
    if (editName.trim() && editName !== recording.name) {
      onRename(recording.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(recording.id);
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handlePlayClick = async () => {
    try {
      await onPlay(recording);
    } catch (e) {
      // no-op
    }
  };

  return (
    <div className="recording-item card fade-in" data-testid="recording-item">
      <div className="recording-header">
        {isEditing ? (
          <input
            type="text"
            className="recording-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditName(recording.name);
                setIsEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <h3 
            className="recording-name" 
            onClick={() => setIsEditing(true)}
            title="Click to rename"
          >
            {recording.name}
          </h3>
        )}
        
        <button
          className={`favorite-btn ${recording.isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(recording.id)}
          aria-label={recording.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {recording.isFavorite ? '❤️' : '♡'}
        </button>
      </div>

      <div className="recording-meta">
        <span className="text-muted">{formatDate(recording.timestamp)}</span>
        <span className="text-muted">•</span>
        <span className="text-muted">{formatDuration(recording.duration)}</span>
        {recording.isEncrypted && (
          <>
            <span className="text-muted">•</span>
            <span className="text-muted">🔒 Encrypted</span>
          </>
        )}
      </div>

      <div className="recording-actions">
        <button 
          className="btn btn-primary"
          onClick={handlePlayClick}
          disabled={isPlaying}
        >
          {isPlaying ? '🔊 Playing' : '▶️ Play'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={handleDelete}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
