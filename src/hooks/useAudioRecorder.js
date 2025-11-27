import { useState, useEffect, useCallback, useRef } from 'react';
import { getAudioService } from '../services/audioService';

/**
 * Hook for managing audio recording
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioServiceRef = useRef(null);

  // Initialize audio service
  useEffect(() => {
    const initAudio = async () => {
      try {
        const service = getAudioService();
        await service.initialize();
        service.startBuffering();
        audioServiceRef.current = service;
        setIsInitialized(true);
        setIsBuffering(true);
      } catch (err) {
        setError(err.message);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.cleanup();
      }
    };
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (!audioServiceRef.current) {
      setError('Audio service not initialized');
      return null;
    }

    try {
      const result = await audioServiceRef.current.toggleRecording();
      if (result) {
        setIsRecording(false);
      } else {
        setIsRecording(true);
      }
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Start capture
  const startCapture = useCallback(() => {
    if (!audioServiceRef.current) {
      setError('Audio service not initialized');
      return;
    }

    try {
      audioServiceRef.current.startCapture();
      setIsRecording(true);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Stop capture
  const stopCapture = useCallback(async () => {
    if (!audioServiceRef.current) {
      setError('Audio service not initialized');
      return null;
    }

    try {
      const result = await audioServiceRef.current.stopCapture();
      setIsRecording(false);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    isRecording,
    isBuffering,
    isInitialized,
    error,
    toggleRecording,
    startCapture,
    stopCapture,
  };
}
