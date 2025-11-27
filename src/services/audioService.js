import {
  BUFFER_DURATION_MS,
  CHUNK_DURATION_MS,
  AUDIO_MIME_TYPE,
  AUDIO_BITS_PER_SECOND,
} from '../utils/constants';

/**
 * Circular buffer for storing audio chunks
 */
export class CircularAudioBuffer {
  constructor(durationMs = BUFFER_DURATION_MS, chunkDurationMs = CHUNK_DURATION_MS) {
    this.maxChunks = Math.ceil(durationMs / chunkDurationMs);
    this.chunks = [];
    this.chunkDuration = chunkDurationMs;
  }

  addChunk(blob) {
    if (blob && blob.size > 0) {
      this.chunks.push(blob);
      if (this.chunks.length > this.maxChunks) {
        this.chunks.shift(); // Remove oldest chunk
      }
    }
  }

  getBuffer() {
    return new Blob(this.chunks, { type: AUDIO_MIME_TYPE });
  }

  getChunks() {
    return [...this.chunks];
  }

  clear() {
    this.chunks = [];
  }

  size() {
    return this.chunks.length;
  }
}

/**
 * Audio recording service that manages MediaRecorder and circular buffer
 */
export class AudioRecordingService {
  constructor() {
    this.mediaRecorder = null;
    this.recordingMediaRecorder = null;
    this.stream = null;
    this.circularBuffer = new CircularAudioBuffer();
    this.currentRecording = [];
    this.isRecording = false;
    this.isBuffering = false;
  }

  /**
   * Check if the browser supports required APIs
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)
    );
  }

  /**
   * Request microphone permission and initialize recording
   */
  async initialize() {
    if (!AudioRecordingService.isSupported()) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: AUDIO_MIME_TYPE,
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      });

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Always add to circular buffer
          this.circularBuffer.addChunk(event.data);

          // If actively recording, also add to current recording
          if (this.isRecording) {
            this.currentRecording.push(event.data);
          }
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }

  /**
   * Start continuous buffering
   */
  startBuffering() {
    if (!this.mediaRecorder) {
      throw new Error('MediaRecorder not initialized');
    }

    if (this.isBuffering) {
      return;
    }

    this.mediaRecorder.start(CHUNK_DURATION_MS);
    this.isBuffering = true;
  }

  /**
   * Stop buffering
   */
  stopBuffering() {
    if (this.mediaRecorder && this.isBuffering) {
      this.mediaRecorder.stop();
      this.isBuffering = false;
    }
  }

  /**
   * Start capturing audio (includes buffered audio)
   */
  startCapture() {
    if (!this.isBuffering) {
      throw new Error('Must start buffering before capturing');
    }

    // Get buffered chunks as the start of our recording
    this.currentRecording = this.circularBuffer.getChunks();
    this.isRecording = true;
    
    // Stop the buffering recorder
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    // Create a new MediaRecorder for the actual recording
    // This ensures the WebM container is properly structured
    this.recordingMediaRecorder = new MediaRecorder(this.stream, {
      mimeType: AUDIO_MIME_TYPE,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    });
    
    this.recordingMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.currentRecording.push(event.data);
      }
    };
    
    // Start recording
    this.recordingMediaRecorder.start(CHUNK_DURATION_MS);
  }

  /**
   * Stop capturing and return the complete recording
   */
  async stopCapture() {
    if (!this.isRecording) {
      return null;
    }

    this.isRecording = false;

    // Stop the recording MediaRecorder and wait for final chunks
    if (this.recordingMediaRecorder && this.recordingMediaRecorder.state === 'recording') {
      await new Promise((resolve) => {
        this.recordingMediaRecorder.onstop = resolve;
        this.recordingMediaRecorder.stop();
      });
    }

    // Create blob from buffered chunks + recorded chunks
    const recordingBlob = new Blob(this.currentRecording, { type: AUDIO_MIME_TYPE });
    
    // Calculate duration (approximate based on chunks)
    const durationMs = this.currentRecording.length * CHUNK_DURATION_MS;

    // Clear current recording
    const chunks = this.currentRecording;
    this.currentRecording = [];
    
    // Restart buffering recorder
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.mediaRecorder.start(CHUNK_DURATION_MS);
    }

    return {
      blob: recordingBlob,
      duration: durationMs,
      mimeType: AUDIO_MIME_TYPE,
      chunkCount: chunks.length,
    };
  }

  /**
   * Toggle recording state
   */
  async toggleRecording() {
    if (this.isRecording) {
      return await this.stopCapture();
    } else {
      this.startCapture();
      return null;
    }
  }

  /**
   * Get current recording state
   */
  getState() {
    return {
      isRecording: this.isRecording,
      isBuffering: this.isBuffering,
      bufferSize: this.circularBuffer.size(),
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.mediaRecorder) {
      if (this.isBuffering) {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    
    if (this.recordingMediaRecorder) {
      if (this.recordingMediaRecorder.state === 'recording') {
        this.recordingMediaRecorder.stop();
      }
      this.recordingMediaRecorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.circularBuffer.clear();
    this.currentRecording = [];
    this.isRecording = false;
    this.isBuffering = false;
  }
}

// Create a singleton instance
let audioService = null;

export function getAudioService() {
  if (!audioService) {
    audioService = new AudioRecordingService();
  }
  return audioService;
}

export function resetAudioService() {
  if (audioService) {
    audioService.cleanup();
  }
  audioService = null;
}
