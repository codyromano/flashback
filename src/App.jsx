import React, { useState } from 'react';
import { RecordButton } from './components/RecordButton';
import { RecordingsList } from './components/RecordingsList';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useRecordings } from './hooks/useRecordings';
import './styles/globals.css';
import './App.css';

function App() {
  const {
    isRecording,
    isBuffering,
    isInitialized,
    error: recorderError,
    toggleRecording,
  } = useAudioRecorder();

  const {
    recordings,
    loading,
    error: storageError,
    storageInfo,
    loadRecordings,
    addRecording,
    renameRecording,
    toggleRecordingFavorite,
    removeRecording,
  } = useRecordings();

  const [currentView, setCurrentView] = useState('record');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleRecording = async () => {
    const result = toggleRecording();
    
    if (result) {
      // Recording stopped, save it
      try {
        await addRecording(result.blob, {
          duration: result.duration,
        });
        showNotification('Recording saved successfully!', 'success');
      } catch (err) {
        showNotification('Failed to save recording', 'error');
      }
    }
  };

  const handlePlay = (recording) => {
    // Create audio URL and play
    const url = URL.createObjectURL(recording.audioBlob);
    const audio = new Audio(url);
    audio.play().catch(err => {
      showNotification('Failed to play recording', 'error');
    });
    
    // Clean up URL after audio finishes
    audio.onended = () => URL.revokeObjectURL(url);
  };

  const handleRename = async (id, name) => {
    try {
      await renameRecording(id, name);
      showNotification('Renamed successfully', 'success');
    } catch (err) {
      showNotification('Failed to rename', 'error');
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await toggleRecordingFavorite(id);
    } catch (err) {
      showNotification('Failed to update favorite', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeRecording(id);
      showNotification('Recording deleted', 'success');
    } catch (err) {
      showNotification('Failed to delete recording', 'error');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Flashback</h1>
        <p className="app-subtitle">Capture the moment, even if it's already passed</p>
      </header>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {storageInfo && storageInfo.isNearLimit && (
        <div className="storage-warning">
          ⚠️ Storage almost full: {storageInfo.usageFormatted} / {storageInfo.quotaFormatted}
        </div>
      )}

      {(recorderError || storageError) && (
        <div className="error-banner">
          {recorderError || storageError}
        </div>
      )}

      <nav className="app-nav">
        <button
          className={`nav-btn ${currentView === 'record' ? 'active' : ''}`}
          onClick={() => setCurrentView('record')}
        >
          Record
        </button>
        <button
          className={`nav-btn ${currentView === 'browse' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('browse');
            loadRecordings();
          }}
        >
          Browse
        </button>
      </nav>

      <main className="app-main container">
        {currentView === 'record' ? (
          <div className="record-view">
            <RecordButton
              isRecording={isRecording}
              isBuffering={isBuffering}
              onToggle={handleToggleRecording}
              disabled={!isInitialized}
            />
            
            {isBuffering && (
              <div className="buffer-indicator">
                <div className="pulse-dot" />
                <span className="text-muted">Buffering last 15 seconds...</span>
              </div>
            )}
          </div>
        ) : (
          <RecordingsList
            recordings={recordings}
            loading={loading}
            error={storageError}
            onPlay={handlePlay}
            onRename={handleRename}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onLoad={loadRecordings}
          />
        )}
      </main>

      <footer className="app-footer">
        <p className="text-muted">Made with ❤️ for capturing fleeting moments</p>
      </footer>
    </div>
  );
}

export default App;
