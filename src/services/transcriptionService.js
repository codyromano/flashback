import { pipeline } from '@xenova/transformers';
import { WHISPER_MODEL } from '../utils/constants';

let transcriptionPipeline = null;
let isLoading = false;
let loadingPromise = null;

/**
 * Initialize the Whisper transcription pipeline
 */
async function initTranscriptionPipeline() {
  if (transcriptionPipeline) {
    return transcriptionPipeline;
  }

  if (isLoading) {
    return loadingPromise;
  }

  isLoading = true;
  loadingPromise = pipeline('automatic-speech-recognition', WHISPER_MODEL)
    .then((pipe) => {
      transcriptionPipeline = pipe;
      isLoading = false;
      return pipe;
    })
    .catch((error) => {
      isLoading = false;
      loadingPromise = null;
      throw error;
    });

  return loadingPromise;
}

/**
 * Convert audio blob to format suitable for Whisper
 */
async function prepareAudioForTranscription(audioBlob) {
  // Create audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Decode audio data
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Get audio data as Float32Array (mono)
  let audioData = audioBuffer.getChannelData(0);
  
  // If stereo, average the channels
  if (audioBuffer.numberOfChannels > 1) {
    const channel2 = audioBuffer.getChannelData(1);
    const mono = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      mono[i] = (audioData[i] + channel2[i]) / 2;
    }
    audioData = mono;
  }
  
  return audioData;
}

/**
 * Transcribe audio blob to text
 */
export async function transcribeAudio(audioBlob, onProgress = null) {
  try {
    // Initialize pipeline if needed
    if (onProgress) {
      onProgress({ status: 'loading_model', progress: 0 });
    }
    
    const pipe = await initTranscriptionPipeline();
    
    if (onProgress) {
      onProgress({ status: 'preparing_audio', progress: 30 });
    }
    
    // Prepare audio data
    const audioData = await prepareAudioForTranscription(audioBlob);
    
    if (onProgress) {
      onProgress({ status: 'transcribing', progress: 50 });
    }
    
    // Transcribe
    const result = await pipe(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });
    
    if (onProgress) {
      onProgress({ status: 'complete', progress: 100 });
    }
    
    return {
      text: result.text.trim(),
      chunks: result.chunks || [],
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Check if transcription is supported
 */
export function isTranscriptionSupported() {
  return !!(window.AudioContext || window.webkitAudioContext);
}

/**
 * Get transcription model loading status
 */
export function getTranscriptionStatus() {
  return {
    isReady: !!transcriptionPipeline,
    isLoading,
  };
}

/**
 * Preload transcription model
 */
export async function preloadTranscriptionModel(onProgress = null) {
  return initTranscriptionPipeline();
}
