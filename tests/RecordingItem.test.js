import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordingItem } from '../src/components/RecordingItem';

describe('RecordingItem', () => {
  const mockRecording = {
    id: 'test-123',
    name: 'Test Recording',
    timestamp: Date.now(),
    duration: 30000,
    isFavorite: false,
    isEncrypted: false,
    audioBlob: new Blob(['audio'], { type: 'audio/webm' }),
  };

  test('should render recording name', () => {
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('Test Recording')).toBeInTheDocument();
  });

  test('should display formatted duration', () => {
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('0:30')).toBeInTheDocument();
  });

  test('should show encryption indicator when encrypted', () => {
    const encryptedRecording = { ...mockRecording, isEncrypted: true };
    render(
      <RecordingItem
        recording={encryptedRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText(/🔒 Encrypted/)).toBeInTheDocument();
  });

  test('should call onPlay when play button clicked', () => {
    const onPlay = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={onPlay}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText(/Play/));
    expect(onPlay).toHaveBeenCalledWith(mockRecording);
  });

  test('should toggle favorite when heart clicked', () => {
    const onToggleFavorite = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={onToggleFavorite}
        onDelete={jest.fn()}
      />
    );
    
    const favoriteBtn = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteBtn);
    expect(onToggleFavorite).toHaveBeenCalledWith('test-123');
  });

  test('should show filled heart when favorited', () => {
    const favoritedRecording = { ...mockRecording, isFavorite: true };
    render(
      <RecordingItem
        recording={favoritedRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  test('should enable editing mode when name clicked', () => {
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Test Recording'));
    expect(screen.getByDisplayValue('Test Recording')).toBeInTheDocument();
  });

  test('should call onRename when editing finished', async () => {
    const onRename = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={onRename}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Test Recording'));
    const input = screen.getByDisplayValue('Test Recording');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.blur(input);
    
    expect(onRename).toHaveBeenCalledWith('test-123', 'New Name');
  });

  test('should not rename if value unchanged', () => {
    const onRename = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={onRename}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Test Recording'));
    const input = screen.getByDisplayValue('Test Recording');
    fireEvent.blur(input);
    
    expect(onRename).not.toHaveBeenCalled();
  });

  test('should call onDelete when delete clicked', () => {
    const onDelete = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={onDelete}
      />
    );
    
    fireEvent.click(screen.getByText(/Delete/));
    expect(onDelete).toHaveBeenCalledWith('test-123');
  });

  test('should format date as "Today" for today recordings', () => {
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={jest.fn()}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  test('should handle Enter key to save name', () => {
    const onRename = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={onRename}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Test Recording'));
    const input = screen.getByDisplayValue('Test Recording');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(onRename).toHaveBeenCalledWith('test-123', 'New Name');
  });

  test('should handle Escape key to cancel editing', () => {
    const onRename = jest.fn();
    render(
      <RecordingItem
        recording={mockRecording}
        onPlay={jest.fn()}
        onRename={onRename}
        onToggleFavorite={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Test Recording'));
    const input = screen.getByDisplayValue('Test Recording');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
  });
});
