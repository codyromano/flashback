import { pipeline } from '@xenova/transformers';
import {
  transcribeAudio,
  isTranscriptionSupported,
  getTranscriptionStatus,
  preloadTranscriptionModel,
} from '../src/services/transcriptionService';

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}));

describe('TranscriptionService', () => {
  let mockPipeline;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock function that pipeline() returns
    mockPipeline = jest.fn().mockResolvedValue({
      text: 'Hello world',
      chunks: [{ text: 'Hello', timestamp: [0, 1] }],
    });
    // Make pipeline return the mock function
    pipeline.mockResolvedValue(mockPipeline);
  });

  test('should check if transcription is supported', () => {
    expect(isTranscriptionSupported()).toBe(true);
  });

  test('should get transcription status', () => {
    const status = getTranscriptionStatus();
    expect(status).toHaveProperty('isReady');
    expect(status).toHaveProperty('isLoading');
  });

  test('should preload model', async () => {
    await preloadTranscriptionModel();
    expect(pipeline).toHaveBeenCalled();
  });

  test('should transcribe audio', async () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    const audioBlob = new Blob([mockArrayBuffer], { type: 'audio/webm' });
    audioBlob.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);

    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 16000,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(100)),
    };

    const mockAudioContext = {
      decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
      close: jest.fn().mockResolvedValue(undefined),
    };

    global.AudioContext = jest.fn(() => mockAudioContext);

    const result = await transcribeAudio(audioBlob);

    expect(result.text).toBe('Hello world');
    expect(result.chunks).toHaveLength(1);
  });

  test('should transcribe stereo audio by averaging channels', async () => {
    const mockArrayBuffer = new ArrayBuffer(100);
    const audioBlob = new Blob([mockArrayBuffer], { type: 'audio/webm' });
    audioBlob.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);

    const leftChannel = new Float32Array([1.0, 0.5]);
    const rightChannel = new Float32Array([0.0, 0.5]);

    const mockAudioBuffer = {
      numberOfChannels: 2,
      sampleRate: 16000,
      getChannelData: jest.fn()
        .mockReturnValueOnce(leftChannel)
        .mockReturnValueOnce(rightChannel),
    };

    const mockAudioContext = {
      decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
      close: jest.fn().mockResolvedValue(undefined),
    };

    global.AudioContext = jest.fn(() => mockAudioContext);

    const result = await transcribeAudio(audioBlob);

    expect(result.text).toBe('Hello world');
  });

  test('should handle transcription with progress callback', async () => {
    const onProgress = jest.fn();
    const mockArrayBuffer = new ArrayBuffer(100);
    const audioBlob = new Blob([mockArrayBuffer], { type: 'audio/webm' });
    audioBlob.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);

    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 16000,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(100)),
    };

    const mockAudioContext = {
      decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
      close: jest.fn().mockResolvedValue(undefined),
    };

    global.AudioContext = jest.fn(() => mockAudioContext);

    await transcribeAudio(audioBlob, onProgress);

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ status: 'loading_model' }));
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ status: 'complete' }));
  });
});
