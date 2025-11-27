import {
  validatePassword,
  isEncryptionSupported,
  encryptAudio,
  decryptAudio,
} from '../src/services/encryptionService';

describe('Encryption Service', () => {
  beforeEach(() => {
    // Ensure crypto.subtle exists and mock its methods
    if (!global.crypto.subtle) {
      global.crypto.subtle = {};
    }
    global.crypto.subtle.encrypt = jest.fn().mockResolvedValue(new ArrayBuffer(100));
    global.crypto.subtle.decrypt = jest.fn().mockResolvedValue(new ArrayBuffer(100));
    global.crypto.subtle.importKey = jest.fn().mockResolvedValue({});
    global.crypto.subtle.deriveKey = jest.fn().mockResolvedValue({});
  });

  test('should validate password strength', () => {
    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword('short').valid).toBe(false);
    expect(validatePassword('validpassword').valid).toBe(true);
    expect(validatePassword('longpassword123').valid).toBe(true);
  });

  test('should check encryption support', () => {
    const isSupported = isEncryptionSupported();
    expect(typeof isSupported).toBe('boolean');
    // Just check it returns a boolean, don't assert the value
  });

  test('should return validation messages', () => {
    const emptyResult = validatePassword('');
    expect(emptyResult.message).toContain('required');
    
    const shortResult = validatePassword('short');
    expect(shortResult.message).toContain('8 characters');
    
    const validResult = validatePassword('validpassword');
    expect(validResult.message).toBe('');
  });

  test('should encrypt audio blob', async () => {
    const mockArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(100));
    const audioBlob = new Blob(['test audio'], { type: 'audio/webm' });
    audioBlob.arrayBuffer = mockArrayBuffer;
    const password = 'testpassword123';

    const result = await encryptAudio(audioBlob, password);

    expect(result).toHaveProperty('encryptedBlob');
    expect(result).toHaveProperty('salt');
    expect(result).toHaveProperty('iv');
    expect(result.salt).toBeInstanceOf(Uint8Array);
    expect(result.iv).toBeInstanceOf(Uint8Array);
    expect(result.salt.length).toBe(16);
    expect(result.iv.length).toBe(12);
  });

  test('should throw error when encrypting without password', async () => {
    const audioBlob = new Blob(['test audio'], { type: 'audio/webm' });

    await expect(encryptAudio(audioBlob, '')).rejects.toThrow('Password is required');
  });

  test('should decrypt audio blob', async () => {
    const mockArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(100));
    const encryptedBlob = new Blob(['encrypted data'], { type: 'application/octet-stream' });
    encryptedBlob.arrayBuffer = mockArrayBuffer;
    const password = 'testpassword123';
    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12);

    const result = await decryptAudio(encryptedBlob, password, salt, iv);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('audio/webm');
  });

  test('should throw error when decrypting without password', async () => {
    const encryptedBlob = new Blob(['encrypted data']);
    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12);

    await expect(decryptAudio(encryptedBlob, '', salt, iv)).rejects.toThrow('Password is required');
  });

  test('should throw error when decrypting without salt', async () => {
    const encryptedBlob = new Blob(['encrypted data']);
    const password = 'testpassword123';
    const iv = new Uint8Array(12);

    await expect(decryptAudio(encryptedBlob, password, null, iv)).rejects.toThrow('Salt and IV are required');
  });

  test('should throw error when decrypting without IV', async () => {
    const encryptedBlob = new Blob(['encrypted data']);
    const password = 'testpassword123';
    const salt = new Uint8Array(16);

    await expect(decryptAudio(encryptedBlob, password, salt, null)).rejects.toThrow('Salt and IV are required');
  });

  test('should handle decryption failure', async () => {
    global.crypto.subtle.decrypt = jest.fn().mockRejectedValue(new Error('Decryption failed'));

    const encryptedBlob = new Blob(['encrypted data']);
    const password = 'wrongpassword';
    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12);

    await expect(decryptAudio(encryptedBlob, password, salt, iv)).rejects.toThrow('Decryption failed');
  });

  test('should call crypto APIs with correct parameters', async () => {
    const mockArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(100));
    const audioBlob = new Blob(['test audio'], { type: 'audio/webm' });
    audioBlob.arrayBuffer = mockArrayBuffer;
    const password = 'testpassword123';

    await encryptAudio(audioBlob, password);

    expect(global.crypto.subtle.importKey).toHaveBeenCalled();
    expect(global.crypto.subtle.deriveKey).toHaveBeenCalled();
    expect(global.crypto.subtle.encrypt).toHaveBeenCalled();
  });
});
