import { useState, useCallback } from 'react';
import {
  getAllRecordings,
  getFavoriteRecordings,
  saveRecording,
  updateRecordingName,
  toggleFavorite,
  deleteRecording,
  getStorageInfo,
} from '../services/storageService';

/**
 * Hook for managing recordings storage
 */
export function useRecordings() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  // Load all recordings
  const loadRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllRecordings();
      setRecordings(data);
      const storage = await getStorageInfo();
      setStorageInfo(storage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load favorite recordings
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFavoriteRecordings();
      setRecordings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a new recording
  const addRecording = useCallback(async (audioBlob, options = {}) => {
    setError(null);
    try {
      const recording = await saveRecording(audioBlob, options);
      setRecordings((prev) => [recording, ...prev]);
      const storage = await getStorageInfo();
      setStorageInfo(storage);
      return recording;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update recording name
  const renameRecording = useCallback(async (id, name) => {
    setError(null);
    try {
      await updateRecordingName(id, name);
      setRecordings((prev) =>
        prev.map((rec) => (rec.id === id ? { ...rec, name } : rec))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Toggle favorite status
  const toggleRecordingFavorite = useCallback(async (id) => {
    setError(null);
    try {
      await toggleFavorite(id);
      setRecordings((prev) =>
        prev.map((rec) =>
          rec.id === id ? { ...rec, isFavorite: !rec.isFavorite } : rec
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete a recording
  const removeRecording = useCallback(async (id) => {
    setError(null);
    try {
      await deleteRecording(id);
      setRecordings((prev) => prev.filter((rec) => rec.id !== id));
      const storage = await getStorageInfo();
      setStorageInfo(storage);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    recordings,
    loading,
    error,
    storageInfo,
    loadRecordings,
    loadFavorites,
    addRecording,
    renameRecording,
    toggleRecordingFavorite,
    removeRecording,
  };
}
