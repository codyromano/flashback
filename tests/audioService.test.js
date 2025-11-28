import { CircularAudioBuffer, AudioRecordingService } from '../src/services/audioService';

describe('CircularAudioBuffer', () => {
  test('should create a buffer with correct max samples', () => {
    const buffer = new CircularAudioBuffer(15000, 48000, 2);
    expect(buffer.maxSamples).toBe(48000 * 15); // 15 seconds at 48kHz
  });

  test('should add samples to buffer', () => {
    const buffer = new CircularAudioBuffer(1000, 48000, 2); // 1 second
    const leftChannel = new Float32Array(100);
    const rightChannel = new Float32Array(100);
    
    buffer.addSamples([leftChannel, rightChannel]);
    expect(buffer.getSampleCount()).toBe(100);
  });

  test('should handle circular wrap-around when buffer is full', () => {
    const buffer = new CircularAudioBuffer(100, 48000, 2); // Very small buffer
    const maxSamples = Math.ceil((100 / 1000) * 48000); // ~4800 samples
    
    // Add more samples than buffer can hold
    for (let i = 0; i < 10; i++) {
      const samples = [new Float32Array(1000), new Float32Array(1000)];
      buffer.addSamples(samples);
    }
    
    // Should only keep last maxSamples
    expect(buffer.getSampleCount()).toBe(maxSamples);
  });

  test('should return samples in chronological order', () => {
    const buffer = new CircularAudioBuffer(1000, 48000, 2);
    const samples1 = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
    const samples2 = [new Float32Array([7, 8, 9]), new Float32Array([10, 11, 12])];
    
    buffer.addSamples(samples1);
    buffer.addSamples(samples2);
    
    const result = buffer.getSamples();
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(12); // 6 samples * 2 channels
  });

  test('should clear buffer', () => {
    const buffer = new CircularAudioBuffer(1000, 48000, 2);
    buffer.addSamples([new Float32Array(100), new Float32Array(100)]);
    
    buffer.clear();
    expect(buffer.getSampleCount()).toBe(0);
  });
});

describe('AudioRecordingService', () => {
  test('should check browser support', () => {
    const isSupported = AudioRecordingService.isSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  test('should initialize successfully', async () => {
    const service = new AudioRecordingService();
    await expect(service.initialize()).resolves.toBe(true);
    expect(service.audioContext).toBeDefined();
    expect(service.circularBuffer).toBeDefined();
    service.cleanup();
  });

  test('should start buffering', async () => {
    const service = new AudioRecordingService();
    await service.initialize();
    
    service.startBuffering();
    expect(service.getState().isBuffering).toBe(true);
    
    service.cleanup();
  });

  test('should start and stop capture', async () => {
    const service = new AudioRecordingService();
    await service.initialize();
    service.startBuffering();
    
    service.startCapture();
    expect(service.getState().isRecording).toBe(true);
    
    const result = await service.stopCapture();
    expect(service.getState().isRecording).toBe(false);
    expect(result).toHaveProperty('blob');
    expect(result).toHaveProperty('duration');
    
    service.cleanup();
  });

  test('should toggle recording', async () => {
    const service = new AudioRecordingService();
    await service.initialize();
    service.startBuffering();
    
    // Start recording
    let result = await service.toggleRecording();
    expect(result).toBeNull();
    expect(service.getState().isRecording).toBe(true);
    
    // Stop recording
    result = await service.toggleRecording();
    expect(result).toBeDefined();
    expect(service.getState().isRecording).toBe(false);
    
    service.cleanup();
  });

  test('should cleanup resources', async () => {
    const service = new AudioRecordingService();
    await service.initialize();
    service.startBuffering();
    
    service.cleanup();
    expect(service.audioContext).toBeNull();
    expect(service.stream).toBeNull();
    expect(service.getState().isBuffering).toBe(false);
  });

  test('should handle unsupported browser', () => {
    const originalMediaDevices = navigator.mediaDevices;
    delete navigator.mediaDevices;
    
    expect(AudioRecordingService.isSupported()).toBe(false);
    
    navigator.mediaDevices = originalMediaDevices;
  });

  test('should handle initialization failure', async () => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    const mockError = new Error('Permission denied');
    navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(mockError);
    
    const service = new AudioRecordingService();
    await expect(service.initialize()).rejects.toThrow('Microphone access denied');
    
    // Restore
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });

  test('should handle recording state correctly', async () => {
    const service = new AudioRecordingService();
    await service.initialize();
    
    const initialState = service.getState();
    expect(initialState.isRecording).toBe(false);
    expect(initialState.isBuffering).toBe(false);
    
    service.cleanup();
  });
});
