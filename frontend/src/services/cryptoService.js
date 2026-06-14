// Helper to convert ArrayBuffer to Hex string
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex string to ArrayBuffer
export function hexToBuffer(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to wrap base64 in PEM format
function chunkString(str, length) {
  const numChunks = Math.ceil(str.length / length);
  const chunks = new Array(numChunks);
  for (let i = 0, o = 0; i < numChunks; ++i, o += length) {
    chunks[i] = str.substr(o, length);
  }
  return chunks.join('\n');
}

/**
 * Coerces JSDOM VM context ArrayBuffers into Node process-level Uint8Array
 * to bypass the cross-realm check in Node's crypto implementation during testing.
 */
function coerceToNative(buffer) {
  if (!buffer) return buffer;
  const uint8 = buffer instanceof Uint8Array
    ? buffer
    : buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer || buffer);

  const native = new globalThis.Uint8Array(uint8.length);
  native.set(uint8);
  return native;
}

/**
 * Encrypts a file using AES-256-CBC
 * @param {ArrayBuffer} fileBuffer 
 * @returns {Promise<{encryptedData: ArrayBuffer, key: string, iv: string}>}
 */
export async function encryptFile(fileBuffer) {
  // Generate random AES key (256-bit)
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Generate random IV (16 bytes)
  const rawIv = new Uint8Array(16);
  window.crypto.getRandomValues(rawIv);
  const ivNative = coerceToNative(rawIv);

  // Encrypt the file buffer
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv: ivNative
    },
    key,
    coerceToNative(fileBuffer)
  );

  // Export AES key raw bytes to hex
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  const keyHex = bufferToHex(exportedKey);
  const ivHex = bufferToHex(rawIv.buffer);

  return {
    encryptedData,
    key: keyHex,
    iv: ivHex
  };
}

/**
 * Decrypts a file using AES-256-CBC
 * @param {ArrayBuffer} encryptedData 
 * @param {string} keyHex 
 * @param {string} ivHex 
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptFile(encryptedData, keyHex, ivHex) {
  const keyBuffer = hexToBuffer(keyHex);
  const key = await window.crypto.subtle.importKey(
    "raw",
    coerceToNative(keyBuffer),
    {
      name: "AES-CBC"
    },
    false,
    ["decrypt"]
  );

  const ivNative = coerceToNative(new Uint8Array(hexToBuffer(ivHex)));

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: ivNative
    },
    key,
    coerceToNative(encryptedData)
  );

  return decryptedData;
}

/**
 * Generates an RSA-OAEP public/private key pair
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export async function generateUserKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: coerceToNative(new Uint8Array([1, 0, 1])),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Export keys
  const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  // Convert to PEM strings
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${chunkString(bufferToBase64(spki), 64)}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${chunkString(bufferToBase64(pkcs8), 64)}\n-----END PRIVATE KEY-----`;

  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem
  };
}

/**
 * Encrypts a symmetric key using a user's RSA public key
 * @param {string} symmetricKey 
 * @param {string} publicKeyPem 
 * @returns {Promise<string>} base64 encrypted key
 */
export async function encryptKeyForUser(symmetricKey, publicKeyPem) {
  const cleanPem = publicKeyPem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s/g, "");
  const spkiBuffer = base64ToBuffer(cleanPem);

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    coerceToNative(spkiBuffer),
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["encrypt"]
  );

  const enc = new TextEncoder();
  const symmetricKeyBytes = enc.encode(symmetricKey);

  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    coerceToNative(symmetricKeyBytes)
  );

  return bufferToBase64(encryptedKeyBuffer);
}

/**
 * Decrypts a symmetric key using a user's RSA private key
 * @param {string} encryptedKeyBase64 
 * @param {string} privateKeyPem 
 * @returns {Promise<string>} decrypted symmetric key hex string
 */
export async function decryptKeyForUser(encryptedKeyBase64, privateKeyPem) {
  const cleanPem = privateKeyPem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s/g, "");
  const pkcs8Buffer = base64ToBuffer(cleanPem);

  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    coerceToNative(pkcs8Buffer),
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["decrypt"]
  );

  const encryptedKeyBuffer = base64ToBuffer(encryptedKeyBase64);

  const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    privateKey,
    coerceToNative(encryptedKeyBuffer)
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedKeyBuffer);
}

/**
 * Shares a symmetric key with multiple users
 * @param {string} symmetricKey 
 * @param {Array<{userId: string, publicKey: string}>} users 
 * @returns {Promise<Record<string, string>>} userId to base64 encrypted key mapping
 */
export async function shareKeyWithUsers(symmetricKey, users) {
  const sharedKeys = {};
  for (const user of users) {
    sharedKeys[user.userId] = await encryptKeyForUser(symmetricKey, user.publicKey);
  }
  return sharedKeys;
}

/**
 * Revokes access for a specific user ID
 * @param {Record<string, string>} sharedKeys 
 * @param {string} userId 
 * @returns {Record<string, string>} updated sharedKeys
 */
export function revokeUserAccess(sharedKeys, userId) {
  const updatedKeys = { ...sharedKeys };
  delete updatedKeys[userId];
  return updatedKeys;
}

/**
 * Initializes RSA keys for the default simulation users (Doctors, Nurses) if not present.
 */
export async function initializeMockUsersKeys() {
  if (typeof window === 'undefined') return;
  
  if (localStorage.getItem('mock_keys_initialized')) return;

  const defaultUsers = [
    { name: 'Dr. Sarah Miller', role: 'Doctor', organization: 'Cardiology Dept' },
    { name: 'Dr. James Watson', role: 'Doctor', organization: 'Cardiology Dept' },
    { name: 'Nurse Kelly Smith', role: 'Nurse', organization: 'General Ward' },
    { name: 'Patient Alex Carter', role: 'Patient', organization: 'Self' }
  ];

  const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');

  for (const user of defaultUsers) {
    const exists = existingUsers.some(u => u.name === user.name);
    if (!exists) {
      try {
        const keyPair = await generateUserKeyPair();
        const userId = 'UID-' + Math.floor(100000 + Math.random() * 900000);
        
        localStorage.setItem(`user_keys_${user.name}`, JSON.stringify({
          userId,
          name: user.name,
          role: user.role,
          organization: user.organization,
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey
        }));

        existingUsers.push({
          userId,
          name: user.name,
          role: user.role,
          organization: user.organization,
          publicKey: keyPair.publicKey
        });
      } catch (e) {
        console.error("Failed to generate keys for default user", user.name, e);
      }
    }
  }

  localStorage.setItem('registered_users', JSON.stringify(existingUsers));
  localStorage.setItem('mock_keys_initialized', 'true');
}

/**
 * Helper to get delay based on test or production context.
 * Returns 1ms during tests to keep execution fast.
 */
export function getDelay(ms) {
  const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST);
  return isTest ? 1 : ms;
}
