import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecordings } from '../src/hooks/useRecordings';
import * as storageService from '../src/services/storageService';

jest.mock('../src/services/storageService');

describe('useRecordings', () => {
  const mockRecordings = [
    {
      id: '1',
      name: 'Recording 1',
      timestamp: Date.now(),
      duration: 30000,
      isFavorite: false,
    },
    {
      id: '2',
      name: 'Recording 2',
      timestamp: Date.now() - 1000,
      duration: 45000,
      isFavorite: true,
    },
  ];

  const mockStorageInfo = {
    usage: 1000000,
    quota: 10000000,
    percentUsed: 0.1,
    isNearLimit: false,
  };

  beforeEach(() => {
    storageService.getAllRecordings.mockResolvedValue(mockRecordings);
    storageService.getFavoriteRecordings.mockResolvedValue([mockRecordings[1]]);
    storageService.getStorageInfo.mockResolvedValue(mockStorageInfo);
    storageService.saveRecording.mockResolvedValue({
      id: '3',
      name: 'New Recording',
      timestamp: Date.now(),
      duration: 5000,
      isFavorite: false,
    });
    storageService.updateRecordingName.mockResolvedValue();
    storageService.toggleFavorite.mockResolvedValue();
    storageService.deleteRecording.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with empty state', () => {
    const { result } = renderHook(() => useRecordings());

    expect(result.current.recordings).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.storageInfo).toBeNull();
  });

  test('should load recordings', async () => {
    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    expect(storageService.getAllRecordings).toHaveBeenCalled();
    expect(storageService.getStorageInfo).toHaveBeenCalled();
    expect(result.current.recordings).toEqual(mockRecordings);
    expect(result.current.storageInfo).toEqual(mockStorageInfo);
    expect(result.current.loading).toBe(false);
  });

  test('should load favorite recordings', async () => {
    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadFavorites();
    });

    expect(storageService.getFavoriteRecordings).toHaveBeenCalled();
    expect(result.current.recordings).toEqual([mockRecordings[1]]);
  });

  test('should handle load error', async () => {
    storageService.getAllRecordings.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    expect(result.current.error).toBe('Load failed');
    expect(result.current.loading).toBe(false);
  });

  test('should add recording', async () => {
    const { result } = renderHook(() => useRecordings());
    const audioBlob = new Blob(['audio'], { type: 'audio/webm' });

    let newRecording;
    await act(async () => {
      newRecording = await result.current.addRecording(audioBlob, { name: 'New Recording' });
    });

    expect(storageService.saveRecording).toHaveBeenCalledWith(audioBlob, { name: 'New Recording' });
    expect(storageService.getStorageInfo).toHaveBeenCalled();
    expect(newRecording.name).toBe('New Recording');
    expect(result.current.recordings).toContainEqual(newRecording);
  });

  test('should rename recording', async () => {
    const { result } = renderHook(() => useRecordings());

    // Load recordings first
    await act(async () => {
      await result.current.loadRecordings();
    });

    await act(async () => {
      await result.current.renameRecording('1', 'Updated Name');
    });

    expect(storageService.updateRecordingName).toHaveBeenCalledWith('1', 'Updated Name');
    const updatedRecording = result.current.recordings.find(r => r.id === '1');
    expect(updatedRecording.name).toBe('Updated Name');
  });

  test('should toggle favorite', async () => {
    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    await act(async () => {
      await result.current.toggleRecordingFavorite('1');
    });

    expect(storageService.toggleFavorite).toHaveBeenCalledWith('1');
    const updatedRecording = result.current.recordings.find(r => r.id === '1');
    expect(updatedRecording.isFavorite).toBe(true);
  });

  test('should remove recording', async () => {
    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    await act(async () => {
      await result.current.removeRecording('1');
    });

    expect(storageService.deleteRecording).toHaveBeenCalledWith('1');
    expect(storageService.getStorageInfo).toHaveBeenCalled();
    expect(result.current.recordings.find(r => r.id === '1')).toBeUndefined();
  });

  test('should handle rename error', async () => {
    storageService.updateRecordingName.mockRejectedValue(new Error('Rename failed'));

    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    await act(async () => {
      try {
        await result.current.renameRecording('1', 'New Name');
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Rename failed');
  });

  test('should handle toggle favorite error', async () => {
    storageService.toggleFavorite.mockRejectedValue(new Error('Toggle failed'));

    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    await act(async () => {
      try {
        await result.current.toggleRecordingFavorite('1');
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Toggle failed');
  });

  test('should handle delete error', async () => {
    storageService.deleteRecording.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useRecordings());

    await act(async () => {
      await result.current.loadRecordings();
    });

    await act(async () => {
      try {
        await result.current.removeRecording('1');
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Delete failed');
  });
});
