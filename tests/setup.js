import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill structuredClone for Node.js < 17
if (!global.structuredClone) {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock Web APIs that aren't available in jsdom
global.crypto = {
  ...global.crypto,
  subtle: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    importKey: jest.fn(),
    deriveKey: jest.fn(),
  },
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};

// Mock MediaRecorder
global.MediaRecorder = class MediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onerror = null;
    this.onstop = null;
    this.eventListeners = {};
  }

  addEventListener(event, handler) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(h => h !== handler);
    }
  }

  start(timeslice) {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    // Fire onstop event
    if (this.onstop) {
      setTimeout(() => this.onstop(), 0);
    }
  }

  requestData() {
    // Trigger dataavailable event
    const event = { data: new Blob(['test'], { type: 'audio/webm;codecs=opus' }) };
    if (this.eventListeners['dataavailable']) {
      this.eventListeners['dataavailable'].forEach(handler => handler(event));
    }
    if (this.ondataavailable) {
      this.ondataavailable(event);
    }
  }

  static isTypeSupported(mimeType) {
    return mimeType === 'audio/webm;codecs=opus';
  }
};

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }],
    })
  ),
};

// Mock AudioContext
global.AudioContext = class AudioContext {
  decodeAudioData(buffer) {
    return Promise.resolve({
      numberOfChannels: 1,
      getChannelData: () => new Float32Array(100),
    });
  }
};

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
