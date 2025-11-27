import { CircularAudioBuffer, AudioRecordingService } from '../src/services/audioService';

describe('CircularAudioBuffer', () => {
  test('should create a buffer with correct max chunks', () => {
    const buffer = new CircularAudioBuffer(15000, 1000);
    expect(buffer.maxChunks).toBe(15);
  });

  test('should add chunks to buffer', () => {
    const buffer = new CircularAudioBuffer(15000, 1000);
    const blob = new Blob(['test'], { type: 'audio/webm' });
    
    buffer.addChunk(blob);
    expect(buffer.size()).toBe(1);
  });

  test('should remove oldest chunk when buffer is full', () => {
    const buffer = new CircularAudioBuffer(3000, 1000); // Max 3 chunks
    
    for (let i = 0; i < 5; i++) {
      buffer.addChunk(new Blob([`chunk${i}`], { type: 'audio/webm' }));
    }
    
    expect(buffer.size()).toBe(3);
  });

  test('should return combined blob', () => {
    const buffer = new CircularAudioBuffer(15000, 1000);
    buffer.addChunk(new Blob(['test1'], { type: 'audio/webm' }));
    buffer.addChunk(new Blob(['test2'], { type: 'audio/webm' }));
    
    const result = buffer.getBuffer();
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('audio/webm;codecs=opus');
  });

  test('should clear buffer', () => {
    const buffer = new CircularAudioBuffer(15000, 1000);
    buffer.addChunk(new Blob(['test'], { type: 'audio/webm' }));
    
    buffer.clear();
    expect(buffer.size()).toBe(0);
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
    expect(service.mediaRecorder).toBeDefined();
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
    
    const result = service.stopCapture();
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
    let result = service.toggleRecording();
    expect(result).toBeNull();
    expect(service.getState().isRecording).toBe(true);
    
    // Stop recording
    result = service.toggleRecording();
    expect(result).toBeDefined();
    expect(service.getState().isRecording).toBe(false);
    
    service.cleanup();
  });

  test('should cleanup resources', async () => {
    const service = new AudioRecordingService();
    await service.initialize();
    service.startBuffering();
    
    service.cleanup();
    expect(service.mediaRecorder).toBeNull();
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
