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
    const result = await toggleRecording();
    
    if (result) {
      // Recording stopped, save it
      try {
        await addRecording(result.blob, {
          duration: result.duration,
        });
        showNotification('Recording saved successfully!', 'success');
      } catch (err) {
        console.error('Failed to save recording:', err);
        showNotification('Failed to save recording', 'error');
      }
    }
  };

  // Track currently playing audio and recording
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const handlePlay = (recording, onPlaybackEnd) => {
    // Pause any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingId(null);
    }
    // Create audio URL and play
    setPlayingId(recording.id);
    console.log('Playing recording:', {
      id: recording.id,
      blobSize: recording.audioBlob?.size,
      blobType: recording.audioBlob?.type,
    });
    if (!recording.audioBlob || recording.audioBlob.size === 0) {
      console.error('Invalid audio blob:', recording.audioBlob);
      showNotification('Recording has no audio data', 'error');
      if (onPlaybackEnd) onPlaybackEnd();
      setPlayingId(null);
      return;
    }
    // Ensure the blob has the correct MIME type
    const audioBlob = recording.audioBlob.type 
      ? recording.audioBlob 
      : new Blob([recording.audioBlob], { type: 'audio/webm' });
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    setCurrentAudio(audio);
    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio loaded successfully, duration:', audio.duration);
    });
    audio.play().catch(err => {
      console.error('Failed to play recording:', err);
      console.error('Blob details:', {
        size: audioBlob.size,
        type: audioBlob.type,
        url: url
      });
      showNotification('Failed to play recording', 'error');
      if (onPlaybackEnd) onPlaybackEnd();
      setCurrentAudio(null);
      setPlayingId(null);
    });
    // Clean up URL after audio finishes
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (onPlaybackEnd) onPlaybackEnd();
      setCurrentAudio(null);
      setPlayingId(null);
    };
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
        <div className={`notification ${notification.type}`} data-testid={notification.type === 'error' ? 'notification-error' : undefined}>
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
            playingId={playingId}
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
