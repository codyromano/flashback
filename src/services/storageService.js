import { openDB } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  RECORDINGS_STORE,
  SETTINGS_STORE,
  STORAGE_WARNING_THRESHOLD,
} from '../utils/constants';

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create recordings store
      if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
        const recordingsStore = db.createObjectStore(RECORDINGS_STORE, {
          keyPath: 'id',
        });
        recordingsStore.createIndex('timestamp', 'timestamp');
        recordingsStore.createIndex('isFavorite', 'isFavorite');
        recordingsStore.createIndex('name', 'name');
      }

      // Create settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, {
          keyPath: 'key',
        });
      }
    },
  });
}

/**
 * Generate a unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save a recording to IndexedDB
 */
export async function saveRecording(audioBlob, options = {}) {
  const db = await initDB();

  const recording = {
    id: generateId(),
    name: options.name || `Recording ${new Date().toLocaleString()}`,
    audioBlob,
    duration: options.duration || 0,
    timestamp: Date.now(),
    isFavorite: false,
    isEncrypted: options.isEncrypted || false,
    encryptionSalt: options.encryptionSalt || null,
    encryptionIv: options.encryptionIv || null,
    transcription: null,
  };

  await db.add(RECORDINGS_STORE, recording);
  return recording;
}

/**
 * Get a recording by ID
 */
export async function getRecording(id) {
  const db = await initDB();
  return db.get(RECORDINGS_STORE, id);
}

/**
 * Get all recordings, sorted by timestamp (newest first)
 */
export async function getAllRecordings() {
  const db = await initDB();
  const recordings = await db.getAll(RECORDINGS_STORE);
  return recordings.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get favorite recordings
 */
export async function getFavoriteRecordings() {
  const db = await initDB();
  const recordings = await db.getAllFromIndex(RECORDINGS_STORE, 'isFavorite', 1);
  return recordings.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Update a recording
 */
export async function updateRecording(id, updates) {
  const db = await initDB();
  const recording = await db.get(RECORDINGS_STORE, id);
  
  if (!recording) {
    throw new Error('Recording not found');
  }

  const updatedRecording = { ...recording, ...updates };
  await db.put(RECORDINGS_STORE, updatedRecording);
  return updatedRecording;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id) {
  const db = await initDB();
  const recording = await db.get(RECORDINGS_STORE, id);
  
  if (!recording) {
    throw new Error('Recording not found');
  }

  recording.isFavorite = !recording.isFavorite;
  await db.put(RECORDINGS_STORE, recording);
  return recording;
}

/**
 * Update recording name
 */
export async function updateRecordingName(id, name) {
  return updateRecording(id, { name });
}

/**
 * Update recording transcription
 */
export async function updateRecordingTranscription(id, transcription) {
  return updateRecording(id, { transcription });
}

/**
 * Delete a recording
 */
export async function deleteRecording(id) {
  const db = await initDB();
  await db.delete(RECORDINGS_STORE, id);
}

/**
 * Delete all recordings
 */
export async function deleteAllRecordings() {
  const db = await initDB();
  await db.clear(RECORDINGS_STORE);
}

/**
 * Get storage quota information
 */
export async function getStorageInfo() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
      isNearLimit: false,
    };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage || 0;
  const quota = estimate.quota || 0;
  const percentUsed = quota > 0 ? usage / quota : 0;

  return {
    usage,
    quota,
    percentUsed,
    isNearLimit: percentUsed >= STORAGE_WARNING_THRESHOLD,
    usageFormatted: formatBytes(usage),
    quotaFormatted: formatBytes(quota),
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Settings operations
 */
export async function getSetting(key) {
  const db = await initDB();
  const setting = await db.get(SETTINGS_STORE, key);
  return setting?.value;
}

export async function setSetting(key, value) {
  const db = await initDB();
  await db.put(SETTINGS_STORE, { key, value });
}

export async function deleteSetting(key) {
  const db = await initDB();
  await db.delete(SETTINGS_STORE, key);
}
