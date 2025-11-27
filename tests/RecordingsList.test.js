import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RecordingsList } from '../src/components/RecordingsList';

describe('RecordingsList', () => {
  const mockRecordings = [
    {
      id: '1',
      name: 'Recording 1',
      timestamp: Date.now(),
      duration: 30000,
      isFavorite: false,
      isEncrypted: false,
      audioBlob: new Blob(['audio1'], { type: 'audio/webm' }),
    },
    {
      id: '2',
      name: 'Recording 2',
      timestamp: Date.now() - 1000,
      duration: 45000,
      isFavorite: true,
      isEncrypted: true,
      audioBlob: new Blob(['audio2'], { type: 'audio/webm' }),
    },
  ];

  test('should show loading state', () => {
    render(
      <RecordingsList
        recordings={[]}
        loading={true}
        error={null}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
        onLoad={jest.fn()}
      />
    );
    expect(screen.getByText('Loading recordings...')).toBeInTheDocument();
  });

  test('should show error state', () => {
    render(
      <RecordingsList
        recordings={[]}
        loading={false}
        error="Failed to load"
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
        onLoad={jest.fn()}
      />
    );
    expect(screen.getByText(/Error: Failed to load/)).toBeInTheDocument();
  });

  test('should show empty state when no recordings', () => {
    render(
      <RecordingsList
        recordings={[]}
        loading={false}
        error={null}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
        onLoad={jest.fn()}
      />
    );
    expect(screen.getByText('No recordings yet')).toBeInTheDocument();
  });

  test('should call onLoad on mount', () => {
    const onLoad = jest.fn();
    render(
      <RecordingsList
        recordings={[]}
        loading={false}
        error={null}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
        onLoad={onLoad}
      />
    );
    expect(onLoad).toHaveBeenCalled();
  });

  test('should render list of recordings', () => {
    render(
      <RecordingsList
        recordings={mockRecordings}
        loading={false}
        error={null}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
        onLoad={jest.fn()}
      />
    );
    expect(screen.getByText('Recording 1')).toBeInTheDocument();
    expect(screen.getByText('Recording 2')).toBeInTheDocument();
  });

  test('should show title when recordings exist', () => {
    render(
      <RecordingsList
        recordings={mockRecordings}
        loading={false}
        error={null}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
        onLoad={jest.fn()}
      />
    );
    expect(screen.getByText('Your Recordings')).toBeInTheDocument();
  });

  test('should pass callbacks to RecordingItem', () => {
    const onPlay = jest.fn();
    const onRename = jest.fn();
    const onToggleFavorite = jest.fn();
    const onDelete = jest.fn();

    render(
      <RecordingsList
        recordings={mockRecordings}
        loading={false}
        error={null}
        onPlay={onPlay}
        onRename={onRename}
        onToggleFavorite={onToggleFavorite}
        onDelete={onDelete}
        onLoad={jest.fn()}
      />
    );

    expect(screen.getAllByText(/Play/).length).toBe(2);
  });
});
