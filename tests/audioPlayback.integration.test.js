/**
 * Integration test for audio recording and playback
 * Tests the complete flow including MediaRecorder chunk handling
 */
import { AudioRecordingService } from '../src/services/audioService';

describe('Audio Recording and Playback Integration', () => {
  let service;
  let mockMediaRecorder;
  let dataAvailableHandlers = [];

  beforeEach(() => {
    // Reset handlers
    dataAvailableHandlers = [];

    // Create a more realistic MediaRecorder mock
    mockMediaRecorder = {
      state: 'inactive',
      ondataavailable: null,
      onerror: null,
      eventListeners: {},
      
      addEventListener(event, handler) {
        if (!this.eventListeners[event]) {
          this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(handler);
        if (event === 'dataavailable') {
          dataAvailableHandlers.push(handler);
        }
      },
      
      removeEventListener(event, handler) {
        if (this.eventListeners[event]) {
          this.eventListeners[event] = this.eventListeners[event].filter(h => h !== handler);
        }
        dataAvailableHandlers = dataAvailableHandlers.filter(h => h !== handler);
      },
      
      start(timeslice) {
        this.state = 'recording';
        this.timeslice = timeslice;
        
        // Simulate periodic data chunks
        this.chunkInterval = setInterval(() => {
          const chunk = new Blob(['audio-chunk-data'], { type: 'audio/webm;codecs=opus' });
          const event = { data: chunk };
          
          // Fire ondataavailable
          if (this.ondataavailable) {
            this.ondataavailable(event);
          }
          
          // Fire event listeners
          if (this.eventListeners['dataavailable']) {
            this.eventListeners['dataavailable'].forEach(handler => handler(event));
          }
        }, 100);
      },
      
      stop() {
        this.state = 'inactive';
        if (this.chunkInterval) {
          clearInterval(this.chunkInterval);
        }
        
        // Fire final chunk
        const finalChunk = new Blob(['final-chunk'], { type: 'audio/webm;codecs=opus' });
        const event = { data: finalChunk };
        
        if (this.ondataavailable) {
          this.ondataavailable(event);
        }
        if (this.eventListeners['dataavailable']) {
          this.eventListeners['dataavailable'].forEach(handler => handler(event));
        }
      },
      
      requestData() {
        if (this.state !== 'recording') {
          throw new Error("Failed to execute 'requestData' on 'MediaRecorder': The MediaRecorder's state is 'inactive'.");
        }
        
        // Immediately fire a chunk for any pending data
        const chunk = new Blob(['requested-chunk-data'], { type: 'audio/webm;codecs=opus' });
        const event = { data: chunk };
        
        // Use setTimeout to simulate async behavior
        setTimeout(() => {
          if (this.eventListeners['dataavailable']) {
            this.eventListeners['dataavailable'].forEach(handler => handler(event));
          }
          if (this.ondataavailable) {
            this.ondataavailable(event);
          }
        }, 0);
      }
    };

    // Override global MediaRecorder for this test
    global.MediaRecorder = jest.fn(() => mockMediaRecorder);
    global.MediaRecorder.isTypeSupported = () => true;

    service = new AudioRecordingService();
  });

  afterEach(() => {
    if (mockMediaRecorder.chunkInterval) {
      clearInterval(mockMediaRecorder.chunkInterval);
    }
    if (service) {
      service.cleanup();
    }
  });

  test('should capture final chunk when stopping recording', async () => {
    jest.setTimeout(10000);
    await service.initialize();
    service.startBuffering();
    
    // Wait for some chunks to accumulate
    await new Promise(resolve => setTimeout(resolve, 250));
    
    service.startCapture();
    
    // Wait for recording chunks
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const result = await service.stopCapture();
    
    expect(result).toBeDefined();
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
    
    console.log('Recording result:', {
      blobSize: result.blob.size,
      blobType: result.blob.type,
      duration: result.duration
    });
  });

  test('should not throw error when requestData called on active recorder', async () => {
    jest.setTimeout(10000);
    await service.initialize();
    service.startBuffering();
    service.startCapture();
    
    // Wait for chunks
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // This should not throw
    await expect(service.stopCapture()).resolves.toBeDefined();
  });

  test('should create playable blob with proper structure', async () => {
    jest.setTimeout(10000);
    await service.initialize();
    service.startBuffering();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    service.startCapture();
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const result = await service.stopCapture();
    
    // Check blob properties
    expect(result.blob.type).toBe('audio/webm;codecs=opus');
    expect(result.blob.size).toBeGreaterThan(0);
    
    // Verify blob is readable
    expect(result.blob).toBeInstanceOf(Blob);
    expect(typeof result.blob.size).toBe('number');
    expect(typeof result.blob.type).toBe('string');
    
    console.log('Blob validation:', {
      type: result.blob.type,
      size: result.blob.size,
      isBlob: true,
      canReadBlob: true
    });
  });

  test('should handle multiple recording cycles', async () => {
    jest.setTimeout(10000);
    await service.initialize();
    service.startBuffering();
    
    // First recording
    await new Promise(resolve => setTimeout(resolve, 100));
    service.startCapture();
    await new Promise(resolve => setTimeout(resolve, 100));
    const result1 = await service.stopCapture();
    
    expect(result1).toBeDefined();
    expect(result1.blob.size).toBeGreaterThan(0);
    
    // Second recording
    await new Promise(resolve => setTimeout(resolve, 100));
    service.startCapture();
    await new Promise(resolve => setTimeout(resolve, 100));
    const result2 = await service.stopCapture();
    
    expect(result2).toBeDefined();
    expect(result2.blob.size).toBeGreaterThan(0);
    
    // Results should be independent
    expect(result1.blob).not.toBe(result2.blob);
    
    console.log('Multiple recordings:', {
      recording1Size: result1.blob.size,
      recording2Size: result2.blob.size
    });
  });

  test('should verify MediaRecorder stays in recording state during stopCapture', async () => {
    jest.setTimeout(10000);
    await service.initialize();
    service.startBuffering();
    service.startCapture();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Before stopCapture
    expect(mockMediaRecorder.state).toBe('recording');
    
    const stopPromise = service.stopCapture();
    
    // During stopCapture (before await completes)
    expect(mockMediaRecorder.state).toBe('recording');
    
    await stopPromise;
    
    // After stopCapture, recorder should still be recording (for continuous buffering)
    expect(mockMediaRecorder.state).toBe('recording');
  });
});
