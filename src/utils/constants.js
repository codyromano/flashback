// Audio recording constants
export const BUFFER_DURATION_MS = 15000; // 15 seconds
export const CHUNK_DURATION_MS = 1000; // 1 second chunks
export const AUDIO_MIME_TYPE = 'audio/webm;codecs=opus';
export const AUDIO_BITS_PER_SECOND = 128000;

// IndexedDB constants
export const DB_NAME = 'FlashbackDB';
export const DB_VERSION = 1;
export const RECORDINGS_STORE = 'recordings';
export const SETTINGS_STORE = 'settings';

// Encryption constants
export const PBKDF2_ITERATIONS = 100000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;

// Transcription constants
export const WHISPER_MODEL = 'Xenova/whisper-tiny.en';

// Storage quota warning threshold (80%)
export const STORAGE_WARNING_THRESHOLD = 0.8;
