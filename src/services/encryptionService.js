import {
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from '../utils/constants';

/**
 * Derive encryption key from password
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt audio blob with password
 */
export async function encryptAudio(audioBlob, password) {
  if (!password) {
    throw new Error('Password is required for encryption');
  }

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive encryption key
  const key = await deriveKey(password, salt);

  // Convert blob to ArrayBuffer
  const audioData = await audioBlob.arrayBuffer();

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    audioData
  );

  return {
    encryptedBlob: new Blob([encryptedData], { type: 'application/octet-stream' }),
    salt,
    iv,
  };
}

/**
 * Decrypt audio blob with password
 */
export async function decryptAudio(encryptedBlob, password, salt, iv) {
  if (!password) {
    throw new Error('Password is required for decryption');
  }

  if (!salt || !iv) {
    throw new Error('Salt and IV are required for decryption');
  }

  try {
    // Derive decryption key
    const key = await deriveKey(password, salt);

    // Convert blob to ArrayBuffer
    const encryptedData = await encryptedBlob.arrayBuffer();

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encryptedData
    );

    return new Blob([decryptedData], { type: 'audio/webm' });
  } catch (error) {
    throw new Error('Decryption failed. Incorrect password or corrupted data.');
  }
}

/**
 * Validate password strength (basic validation)
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  return { valid: true, message: '' };
}

/**
 * Check if Web Crypto API is supported
 */
export function isEncryptionSupported() {
  return !!(window.crypto && window.crypto.subtle);
}
