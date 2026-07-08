import mcl from 'mcl-wasm';

const CURVE = mcl.BLS12_381;
const DOMAIN = 'BGW-BE-v1-BLS12-381';

let initPromise;

async function init() {
  if (!initPromise) {
    initPromise = mcl.init(CURVE).then(() => {
      if (typeof mcl.setETHserialization === 'function') {
        mcl.setETHserialization(true);
      }
      if (typeof mcl.setMapToMode === 'function' && mcl.IRTF) {
        mcl.setMapToMode(mcl.IRTF);
      }
      return api;
    });
  }
  return initPromise;
}

function assertReady() {
  if (!initPromise) {
    throw new Error('BGW context is not initialized. Call await bgw.init() first.');
  }
}

function randomFr() {
  assertReady();
  const x = new mcl.Fr();
  x.setByCSPRNG();
  return x;
}

function frFromHex(hex) {
  assertReady();
  const x = new mcl.Fr();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

// Browser-compatible, synchronous pure JS SHA-256 implementation
function sha256Sync(bytes) {
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
      h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const l = bytes.length;
  const n = ((l + 8) >> 6) + 1;
  const w = new Int32Array(n * 16);

  for (let i = 0; i < l; i++) {
    w[i >> 2] |= bytes[i] << (24 - (i & 3) * 8);
  }
  w[l >> 2] |= 0x80 << (24 - (l & 3) * 8);
  w[n * 16 - 1] = l * 8;

  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  for (let i = 0; i < n; i++) {
    const subW = new Int32Array(64);
    for (let j = 0; j < 16; j++) {
      subW[j] = w[i * 16 + j];
    }
    
    for (let j = 16; j < 64; j++) {
      const s0 = (rightRotate(subW[j-15], 7) ^ rightRotate(subW[j-15], 18) ^ (subW[j-15] >>> 3));
      const s1 = (rightRotate(subW[j-2], 17) ^ rightRotate(subW[j-2], 19) ^ (subW[j-2] >>> 10));
      subW[j] = (subW[j-16] + s0 + subW[j-7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + subW[j]) | 0;
      const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const result = new Uint8Array(32);
  const view = new DataView(result.buffer);
  view.setInt32(0, h0, false);
  view.setInt32(4, h1, false);
  view.setInt32(8, h2, false);
  view.setInt32(12, h3, false);
  view.setInt32(16, h4, false);
  view.setInt32(20, h5, false);
  view.setInt32(24, h6, false);
  view.setInt32(28, h7, false);
  return result;
}

function hashToFr(value, label = 'fr') {
  assertReady();
  const encoder = new TextEncoder();
  const domainLabelBytes = encoder.encode(`${DOMAIN}:${label}:`);
  const valueBytes = value instanceof Uint8Array ? value : encoder.encode(String(value));
  
  const combinedBytes = new Uint8Array(domainLabelBytes.length + valueBytes.length);
  combinedBytes.set(domainLabelBytes, 0);
  combinedBytes.set(valueBytes, domainLabelBytes.length);

  const digestBytes = sha256Sync(combinedBytes);
  const digestHex = uint8ArrayToHex(digestBytes);
  
  const x = new mcl.Fr();
  x.setStr(digestHex, 16);
  return x;
}

function generatorG1(label = 'g1') {
  assertReady();
  return mcl.hashAndMapToG1(`${DOMAIN}:${label}`);
}

// Convert Hex string to Uint8Array
function hexToUint8Array(hex) {
  const cleanHex = strip0x(hex);
  const len = cleanHex.length;
  const arr = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    arr[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return arr;
}

// Convert Uint8Array to Hex string
function uint8ArrayToHex(arr) {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to Base64
function uint8ArrayToBase64(arr) {
  let binary = '';
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
}

function generatorG2(label = 'g2') {
  assertReady();
  return mcl.hashAndMapToG2(`${DOMAIN}:${label}`);
}

function oneG1() {
  assertReady();
  const z = new mcl.G1();
  z.clear();
  return z;
}

function oneG2() {
  assertReady();
  const z = new mcl.G2();
  z.clear();
  return z;
}

function serializeFr(x) {
  return x.serializeToHexStr();
}

function serializeG1(x) {
  return x.serializeToHexStr();
}

function serializeG2(x) {
  return x.serializeToHexStr();
}

function serializeGT(x) {
  return x.serializeToHexStr();
}

function deserializeG1(hex) {
  assertReady();
  const x = new mcl.G1();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

function deserializeG2(hex) {
  assertReady();
  const x = new mcl.G2();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

function deserializeGT(hex) {
  assertReady();
  const x = new mcl.GT();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

function strip0x(hex) {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected a hex string.');
  }
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

function normalizeBufferToUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (value == null) return new Uint8Array(0);
  const encoder = new TextEncoder();
  if (typeof value === 'string') return encoder.encode(value);
  return encoder.encode(JSON.stringify(value));
}

async function kdfFromGT(gt, info = 'payload') {
  const ikm = hexToUint8Array(serializeGT(gt));
  const encoder = new TextEncoder();
  
  const saltText = `${DOMAIN}:salt`;
  const saltBytes = sha256Sync(encoder.encode(saltText));
  
  const infoText = `${DOMAIN}:${info}`;
  const infoBytes = encoder.encode(infoText);
  
  const ikmKey = await window.crypto.subtle.importKey(
    'raw',
    ikm,
    'HKDF',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBytes,
      info: infoBytes
    },
    ikmKey,
    256
  );
  
  return new Uint8Array(derivedBits);
}

async function aesGcmEncrypt(key, plaintext, aad) {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['encrypt']
  );
  
  const encryptParams = {
    name: 'AES-GCM',
    iv: iv
  };
  
  if (aad) {
    encryptParams.additionalData = normalizeBufferToUint8Array(aad);
  }
  
  const plaintextBytes = normalizeBufferToUint8Array(plaintext);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    encryptParams,
    cryptoKey,
    plaintextBytes
  );
  
  const ciphertextWithTag = new Uint8Array(ciphertextBuffer);
  const tagLength = 16;
  const ciphertextLength = ciphertextWithTag.length - tagLength;
  
  const ciphertext = ciphertextWithTag.subarray(0, ciphertextLength);
  const tag = ciphertextWithTag.subarray(ciphertextLength);
  
  return {
    alg: 'AES-256-GCM',
    iv: uint8ArrayToBase64(iv),
    tag: uint8ArrayToBase64(tag),
    ciphertext: uint8ArrayToBase64(ciphertext),
  };
}

async function aesGcmDecrypt(key, encrypted, aad) {
  const iv = base64ToUint8Array(encrypted.iv);
  const tag = base64ToUint8Array(encrypted.tag);
  const ciphertext = base64ToUint8Array(encrypted.ciphertext);
  
  const dataToDecrypt = new Uint8Array(ciphertext.length + tag.length);
  dataToDecrypt.set(ciphertext, 0);
  dataToDecrypt.set(tag, ciphertext.length);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['decrypt']
  );
  
  const decryptParams = {
    name: 'AES-GCM',
    iv: iv
  };
  
  if (aad) {
    decryptParams.additionalData = normalizeBufferToUint8Array(aad);
  }
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    decryptParams,
    cryptoKey,
    dataToDecrypt
  );
  
  return new Uint8Array(decryptedBuffer);
}

function assertPositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

function assertRecipientId(id, n) {
  assertPositiveInteger(id, 'recipient id');
  if (id > n) {
    throw new RangeError(`recipient id ${id} exceeds public parameter n=${n}.`);
  }
}

const api = {
  mcl,
  CURVE,
  DOMAIN,
  init,
  randomFr,
  frFromHex,
  hashToFr,
  generatorG1,
  generatorG2,
  oneG1,
  oneG2,
  serializeFr,
  serializeG1,
  serializeG2,
  serializeGT,
  deserializeG1,
  deserializeG2,
  deserializeGT,
  kdfFromGT,
  aesGcmEncrypt,
  aesGcmDecrypt,
  normalizeBuffer: normalizeBufferToUint8Array,
  assertPositiveInteger,
  assertRecipientId,
};

export default api;
export {
  mcl,
  CURVE,
  DOMAIN,
  init,
  randomFr,
  frFromHex,
  hashToFr,
  generatorG1,
  generatorG2,
  oneG1,
  oneG2,
  serializeFr,
  serializeG1,
  serializeG2,
  serializeGT,
  deserializeG1,
  deserializeG2,
  deserializeGT,
  kdfFromGT,
  aesGcmEncrypt,
  aesGcmDecrypt,
  normalizeBufferToUint8Array as normalizeBuffer,
  assertPositiveInteger,
  assertRecipientId,
};
