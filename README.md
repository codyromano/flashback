# Flashback

> Capture the moment, even if it's already passed

Flashback is a mobile-first web application that lets you capture the previous 15 seconds of audio instantly. Perfect for capturing spontaneous moments, important conversations, or fleeting inspiration.

## ✨ Features

- **🎙️ Retroactive Recording**: Tap once to capture the previous 15 seconds of audio
- **💾 Local Storage**: All recordings stored securely on your device using IndexedDB
- **🔒 Optional Encryption**: Protect sensitive recordings with password-based encryption
- **📝 Speech-to-Text**: Automatic transcription using Whisper AI (offline-capable)
- **❤️ Favorites**: Mark important recordings for quick access
- **📱 Mobile-First**: Optimized for mobile browsers with responsive desktop support
- **🎨 Beautiful UI**: Clean, Instagram-inspired design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested with v25.2.1)
- npm 9+ (tested with v11.6.2)
- Modern web browser with MediaRecorder API support

### Installation

```bash
# Clone or navigate to the project
cd flashback

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## 🧪 Testing


### Unit Tests (Jest)

```bash
# Run all unit tests
npx jest

# Run unit tests in watch mode
npx jest --watch

# Run unit tests with coverage
npx jest --coverage
```

### Integration Tests (Playwright)

```bash
# Run all browser integration tests
npx playwright test

# View Playwright test results and traces
npx playwright show-report
npx playwright show-trace test-results/<trace-file>.zip
```

> **Note:** Playwright tests require Chrome, Firefox, or WebKit installed. The integration tests will launch browsers and require microphone permissions.

## 🏗️ Architecture

### Project Structure

```
flashback/
├── src/
│   ├── components/        # React components
│   │   ├── RecordButton.jsx
│   │   ├── RecordingsList.jsx
│   │   └── RecordingItem.jsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAudioRecorder.js
│   │   └── useRecordings.js
│   ├── services/         # Core business logic
│   │   ├── audioService.js
│   │   ├── storageService.js
│   │   ├── encryptionService.js
│   │   └── transcriptionService.js
│   ├── utils/            # Utility functions and constants
│   │   └── constants.js
│   └── styles/           # CSS styles
│       └── globals.css
├── tests/                # Jest tests
├── public/               # Static assets
└── index.html
```

### Core Technologies

- **Frontend**: React 19 with Vite 7
- **Audio Recording**: MediaRecorder API with circular buffer pattern
- **Storage**: IndexedDB via `idb` library
- **Transcription**: Whisper.cpp via @xenova/transformers (WASM)
- **Encryption**: Web Crypto API (AES-GCM)
- **Testing**: Jest with Testing Library

## 🔧 How It Works

### Circular Buffer Recording

Flashback continuously records audio in 1-second chunks, maintaining a rolling 15-second buffer. When you tap the record button:

1. The buffered 15 seconds are captured
2. Recording continues until you tap again
3. The complete audio (buffer + new recording) is saved

### Browser Compatibility

**Fully Supported:**
- Chrome/Edge 85+
- Firefox 65+ (including mobile)
- Safari 14.1+

**Required APIs:**
- MediaStream API
- MediaRecorder API
- IndexedDB
- Web Crypto API
- Web Audio API (for transcription)

### Local HTTPS Testing

The app works on `localhost` without HTTPS (browsers allow `getUserMedia` on localhost). For production or testing on other devices:

**Option 1: Use mkcert (recommended)**
```bash
# Install mkcert
brew install mkcert

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1

# Update vite.config.js to use HTTPS
```

**Option 2: Use Vite's built-in HTTPS**
```bash
npm run dev -- --https
# Accept the browser warning for self-signed cert
```

## 📱 PWA Support

Flashback can be installed as a Progressive Web App:

1. Open the app in a mobile browser
2. Tap "Add to Home Screen" (iOS Safari) or "Install App" (Android Chrome)
3. Use it like a native app!

The manifest is configured in `public/manifest.json`.

## 🔐 Security & Privacy

- **No Network Requests**: All processing happens locally on your device
- **Optional Encryption**: AES-256-GCM encryption with PBKDF2 key derivation
- **No Tracking**: Zero analytics, no data collection
- **Local Storage Only**: Recordings never leave your device

## 📊 Storage Management

Flashback monitors storage usage and warns you when approaching quota limits:

- Recordings are compressed using Opus codec (~1MB per minute)
- Storage quota varies by browser (typically 10-50% of available disk space)
- Delete old recordings to free up space

## 🐛 Troubleshooting

### Microphone Permission Denied
- Check browser permissions in Settings
- Make sure you're using HTTPS (or localhost)
- Try reloading the page

### Storage Full
- Delete old recordings from the Browse tab
- Check browser storage settings
- Consider exporting important recordings

### Transcription Not Working
- Transcription model (~40MB) downloads on first use
- Check internet connection for initial download
- Clear browser cache if stuck loading

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

## 📄 License

ISC

## 🙏 Acknowledgments

- [Whisper](https://github.com/openai/whisper) by OpenAI for speech recognition
- [Transformers.js](https://github.com/xenova/transformers.js) for WASM implementation
- Instagram for design inspiration
- The Web Audio community for MediaRecorder examples

---

Built with ❤️ for capturing fleeting moments
