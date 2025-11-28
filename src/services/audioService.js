import {
  BUFFER_DURATION_MS,
  CHUNK_DURATION_MS,
  AUDIO_MIME_TYPE,
  AUDIO_BITS_PER_SECOND,
} from '../utils/constants';

/**
 * Circular buffer for storing raw PCM audio samples
 */
export class CircularAudioBuffer {
  constructor(durationMs = BUFFER_DURATION_MS, sampleRate = 48000, channels = 2) {
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.maxSamples = Math.ceil((durationMs / 1000) * sampleRate);
    // Interleaved buffer for all channels
    this.buffer = new Float32Array(this.maxSamples * channels);
    this.writeIndex = 0;
    this.samplesWritten = 0;
  }

  /**
   * Add audio samples to the circular buffer
   */
  addSamples(audioData) {
    // audioData is an array of Float32Arrays, one per channel
    const numSamples = audioData[0].length;
    
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < this.channels; channel++) {
        const value = audioData[channel] ? audioData[channel][i] : 0;
        const index = (this.writeIndex * this.channels + channel) % this.buffer.length;
        this.buffer[index] = value;
      }
      this.writeIndex = (this.writeIndex + 1) % this.maxSamples;
      this.samplesWritten++;
    }
  }

  /**
   * Get buffered samples in chronological order
   */
  getSamples() {
    const actualSamples = Math.min(this.samplesWritten, this.maxSamples);
    const result = new Float32Array(actualSamples * this.channels);
    
    // Calculate start position in circular buffer
    const startIndex = this.samplesWritten >= this.maxSamples 
      ? this.writeIndex 
      : 0;
    
    for (let i = 0; i < actualSamples; i++) {
      const sourceIndex = (startIndex + i) % this.maxSamples;
      for (let channel = 0; channel < this.channels; channel++) {
        result[i * this.channels + channel] = this.buffer[sourceIndex * this.channels + channel];
      }
    }
    
    return result;
  }

  clear() {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.samplesWritten = 0;
  }

  getSampleCount() {
    return Math.min(this.samplesWritten, this.maxSamples);
  }
}

/**
 * Audio recording service using Web Audio API for raw audio buffering
 */
export class AudioRecordingService {
  constructor() {
    this.audioContext = null;
    this.stream = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.circularBuffer = null;
    this.recordedSamples = [];
    this.isRecording = false;
    this.isBuffering = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Check if the browser supports required APIs
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.AudioContext &&
      window.MediaRecorder &&
      MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)
    );
  }

  /**
   * Request microphone permission and initialize audio context
   */
  async initialize() {
    if (!AudioRecordingService.isSupported()) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = this.audioContext.sampleRate;

      // Initialize circular buffer
      this.circularBuffer = new CircularAudioBuffer(BUFFER_DURATION_MS, sampleRate, 2);

      // Create source node from stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

      // Try to use AudioWorklet if supported, fallback to ScriptProcessor
      if (this.audioContext.audioWorklet) {
        await this.initializeWithAudioWorklet();
      } else {
        this.initializeWithScriptProcessor();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }

  /**
   * Initialize using ScriptProcessorNode (fallback for older browsers)
   */
  initializeWithScriptProcessor() {
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 2, 2);

    this.processorNode.onaudioprocess = (event) => {
      if (!this.isBuffering && !this.isRecording) return;

      const inputBuffer = event.inputBuffer;
      const channelData = [];
      
      for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
        channelData.push(inputBuffer.getChannelData(channel));
      }

      // Add to circular buffer if buffering
      if (this.isBuffering) {
        this.circularBuffer.addSamples(channelData);
      }

      // Add to recording if actively recording
      if (this.isRecording) {
        // Clone the data since the buffer will be reused
        const clonedData = channelData.map(data => new Float32Array(data));
        this.recordedSamples.push(clonedData);
      }
    };

    // Connect nodes
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  /**
   * Initialize using AudioWorklet (modern browsers)
   */
  async initializeWithAudioWorklet() {
    // For now, fallback to ScriptProcessor
    // AudioWorklet requires a separate processor file which adds complexity
    this.initializeWithScriptProcessor();
  }

  /**
   * Start continuous buffering
   */
  startBuffering() {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    if (this.isBuffering) {
      return;
    }

    this.isBuffering = true;
  }

  /**
   * Stop buffering
   */
  stopBuffering() {
    this.isBuffering = false;
  }

  /**
   * Start capturing audio (includes buffered audio)
   */
  startCapture() {
    if (!this.isBuffering) {
      throw new Error('Must start buffering before capturing');
    }

    this.recordedSamples = [];
    this.isRecording = true;
  }

  /**
   * Convert Float32Array samples to WebM blob using MediaRecorder
   * This approach records directly from the microphone stream while playing back buffered audio
   */
  async samplesToBlob(samples, sampleRate, channels) {
    // Instead of trying to encode synthetic audio with MediaRecorder,
    // we'll use a simpler approach: just keep the original approach but
    // record in real-time from the actual microphone
    // 
    // For now, create a minimal WebM container with the samples
    // In production, you might want to use a library like webm-writer or
    // encode to WAV instead
    
    // Quick fallback: create a WAV file instead of WebM
    // WAV is much simpler and doesn't require MediaRecorder
    return this.samplesToWav(samples, sampleRate, channels);
  }

  /**
   * Convert Float32Array samples to WAV blob
   * WAV is a simple format that's easy to create from raw PCM data
   */
  samplesToWav(samples, sampleRate, channels) {
    const numSamples = samples.length / channels;
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true); // byte rate
    view.setUint16(32, channels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM data (convert Float32 to Int16)
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Stop capturing and return the complete recording
   */
  async stopCapture() {
    if (!this.isRecording) {
      return null;
    }

    this.isRecording = false;

    // Wait a bit to ensure we have some samples
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get buffered samples
    const bufferedSamples = this.circularBuffer.getSamples();
    
    // Combine buffered samples with recorded samples
    let combinedSamples;
    
    if (this.recordedSamples.length === 0) {
      // Only buffered audio (user stopped immediately)
      combinedSamples = bufferedSamples;
    } else {
      // Flatten recorded samples
      const recordedFlat = [];
      for (const sampleSet of this.recordedSamples) {
        const numSamples = sampleSet[0].length;
        for (let i = 0; i < numSamples; i++) {
          for (let channel = 0; channel < sampleSet.length; channel++) {
            recordedFlat.push(sampleSet[channel][i]);
          }
        }
      }

      // Combine buffered + recorded
      combinedSamples = new Float32Array(bufferedSamples.length + recordedFlat.length);
      combinedSamples.set(bufferedSamples, 0);
      combinedSamples.set(recordedFlat, bufferedSamples.length);
    }

    // Check if we have any samples
    if (combinedSamples.length === 0) {
      console.warn('No audio samples captured');
      this.recordedSamples = [];
      return {
        blob: new Blob([], { type: 'audio/wav' }),
        duration: 0,
        mimeType: 'audio/wav',
        sampleRate: this.audioContext.sampleRate,
      };
    }

    // Calculate duration
    const totalSamples = combinedSamples.length / 2; // 2 channels
    const durationMs = (totalSamples / this.audioContext.sampleRate) * 1000;

    console.log('stopCapture:', {
      bufferedSamples: bufferedSamples.length / 2,
      recordedSamples: this.recordedSamples.reduce((sum, s) => sum + s[0].length, 0),
      totalSamples: combinedSamples.length / 2,
      estimatedDuration: durationMs
    });

    try {
      // Convert samples to WAV blob (synchronous but wrapped in promise for consistency)
      const blob = await this.samplesToBlob(
        combinedSamples,
        this.audioContext.sampleRate,
        2
      );

      console.log('Created blob:', { size: blob.size, type: blob.type });

      // Clear recorded samples
      this.recordedSamples = [];

      return {
        blob,
        duration: durationMs,
        mimeType: blob.type,
        sampleRate: this.audioContext.sampleRate,
      };
    } catch (error) {
      console.error('Failed to convert samples to blob:', error);
      this.recordedSamples = [];
      throw error;
    }
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
      bufferSize: this.circularBuffer ? this.circularBuffer.getSampleCount() : 0,
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.isBuffering = false;
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.circularBuffer) {
      this.circularBuffer.clear();
    }

    this.recordedSamples = [];
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
