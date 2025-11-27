import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordButton } from '../src/components/RecordButton';

describe('RecordButton', () => {
  test('should render with correct initial text', () => {
    render(<RecordButton isRecording={false} isBuffering={true} onToggle={jest.fn()} disabled={false} />);
    expect(screen.getByText('Tap to capture last 15s')).toBeInTheDocument();
  });

  test('should show recording text when recording', () => {
    render(<RecordButton isRecording={true} isBuffering={true} onToggle={jest.fn()} disabled={false} />);
    expect(screen.getByText('Tap to stop')).toBeInTheDocument();
  });

  test('should show initializing text when not buffering', () => {
    render(<RecordButton isRecording={false} isBuffering={false} onToggle={jest.fn()} disabled={false} />);
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  test('should call onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<RecordButton isRecording={false} isBuffering={true} onToggle={onToggle} disabled={false} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('should not call onToggle when disabled', () => {
    const onToggle = jest.fn();
    render(<RecordButton isRecording={false} isBuffering={true} onToggle={onToggle} disabled={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onToggle).not.toHaveBeenCalled();
  });

  test('should apply recording class when recording', () => {
    const { container } = render(<RecordButton isRecording={true} isBuffering={true} onToggle={jest.fn()} disabled={false} />);
    const button = container.querySelector('.record-button');
    expect(button).toHaveClass('recording');
  });

  test('should have correct aria-label for recording state', () => {
    const { rerender } = render(<RecordButton isRecording={false} isBuffering={true} onToggle={jest.fn()} disabled={false} />);
    expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
    
    rerender(<RecordButton isRecording={true} isBuffering={true} onToggle={jest.fn()} disabled={false} />);
    expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();
  });

  test('should be disabled when not buffering', () => {
    render(<RecordButton isRecording={false} isBuffering={false} onToggle={jest.fn()} disabled={false} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
