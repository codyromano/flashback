import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioRecorder } from '../src/hooks/useAudioRecorder';
import { getAudioService } from '../src/services/audioService';

// Mock the audio service
jest.mock('../src/services/audioService');

describe('useAudioRecorder', () => {
  let mockAudioService;

  beforeEach(() => {
    mockAudioService = {
      initialize: jest.fn().mockResolvedValue(true),
      startBuffering: jest.fn(),
      toggleRecording: jest.fn(),
      startCapture: jest.fn(),
      stopCapture: jest.fn(),
      getState: jest.fn().mockReturnValue({
        isRecording: false,
        isBuffering: true,
      }),
      cleanup: jest.fn(),
    };
    getAudioService.mockReturnValue(mockAudioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize audio service on mount', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(mockAudioService.initialize).toHaveBeenCalled();
      expect(mockAudioService.startBuffering).toHaveBeenCalled();
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isBuffering).toBe(true);
  });

  test('should handle initialization error', async () => {
    mockAudioService.initialize.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(result.current.error).toBe('Permission denied');
    });
  });

  test('should toggle recording', async () => {
    mockAudioService.toggleRecording.mockResolvedValue({ blob: new Blob(), duration: 5000 });
    mockAudioService.getState.mockReturnValue({
      isRecording: false,
      isBuffering: true,
    });

    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    let recordingResult;
    await act(async () => {
      recordingResult = await result.current.toggleRecording();
    });

    expect(mockAudioService.toggleRecording).toHaveBeenCalled();
    expect(recordingResult).toHaveProperty('blob');
    expect(result.current.isRecording).toBe(false);
  });

  test('should start capture', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.startCapture();
    });

    expect(mockAudioService.startCapture).toHaveBeenCalled();
  });

  test('should stop capture', async () => {
    mockAudioService.stopCapture.mockResolvedValue({ blob: new Blob(), duration: 5000 });
    mockAudioService.getState.mockReturnValue({
      isRecording: false,
      isBuffering: true,
    });

    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    let recordingResult;
    await act(async () => {
      recordingResult = await result.current.stopCapture();
    });

    expect(mockAudioService.stopCapture).toHaveBeenCalled();
    expect(recordingResult).toHaveProperty('blob');
    expect(result.current.isRecording).toBe(false);
  });

  test('should handle toggle error', async () => {
    mockAudioService.toggleRecording.mockImplementation(() => {
      throw new Error('Toggle failed');
    });

    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.toggleRecording();
    });

    expect(result.current.error).toBe('Toggle failed');
  });

  test('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(mockAudioService.initialize).toHaveBeenCalled();
    });

    unmount();

    expect(mockAudioService.cleanup).toHaveBeenCalled();
  });

  test('should handle error when service not initialized', async () => {
    getAudioService.mockReturnValue(null);

    const { result } = renderHook(() => useAudioRecorder());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(false);
    });

    act(() => {
      result.current.toggleRecording();
    });

    expect(result.current.error).toBe('Audio service not initialized');
  });
});
