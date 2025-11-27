import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { useAudioRecorder } from '../src/hooks/useAudioRecorder';
import { useRecordings } from '../src/hooks/useRecordings';

jest.mock('../src/hooks/useAudioRecorder');
jest.mock('../src/hooks/useRecordings');

describe('App', () => {
  const mockToggleRecording = jest.fn();
  const mockLoadRecordings = jest.fn();
  const mockAddRecording = jest.fn();
  const mockRenameRecording = jest.fn();
  const mockToggleFavorite = jest.fn();
  const mockRemoveRecording = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAudioRecorder.mockReturnValue({
      isRecording: false,
      isBuffering: true,
      isInitialized: false,
      error: null,
      toggleRecording: mockToggleRecording,
    });

    useRecordings.mockReturnValue({
      recordings: [],
      loading: false,
      error: null,
      storageInfo: null,
      loadRecordings: mockLoadRecordings,
      addRecording: mockAddRecording,
      renameRecording: mockRenameRecording,
      toggleRecordingFavorite: mockToggleFavorite,
      removeRecording: mockRemoveRecording,
    });
  });

  test('should render app', () => {
    render(<App />);
    expect(screen.getByText('Flashback')).toBeInTheDocument();
  });

  test('should render navigation', () => {
    render(<App />);
    expect(screen.getByText('Record')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  test('should render record button when initialized', () => {
    useAudioRecorder.mockReturnValue({
      isRecording: false,
      isBuffering: false,
      isInitialized: true,
      error: null,
      toggleRecording: mockToggleRecording,
    });
    
    render(<App />);
    expect(screen.getByLabelText(/start recording/i)).toBeInTheDocument();
  });

  test('should display error notification', () => {
    useAudioRecorder.mockReturnValue({
      isRecording: false,
      isBuffering: false,
      isInitialized: false,
      error: 'Microphone access denied',
      toggleRecording: mockToggleRecording,
    });
    
    render(<App />);
    expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
  });

  test('should display storage error', () => {
    useRecordings.mockReturnValue({
      recordings: [],
      loading: false,
      error: 'Storage quota exceeded',
      storageInfo: null,
      loadRecordings: mockLoadRecordings,
      addRecording: mockAddRecording,
      renameRecording: mockRenameRecording,
      toggleRecordingFavorite: mockToggleFavorite,
      removeRecording: mockRemoveRecording,
    });
    
    render(<App />);
    expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
  });
});
