'use strict';

const crypto = require('crypto');
const mcl = require('mcl-wasm');

const CURVE = mcl.BLS12_381;
const DOMAIN = 'BGW-BE-v1-BLS12-381';

let initPromise;

/**
 * Initializes the mcl-wasm library with the BLS12-381 curve.
 * Ensures initialization happens only once and sets up ETH serialization and IRTF mapping.
 */
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

/**
 * Checks if the BGW context has been initialized.
 * Throws an error if init() has not been called yet.
 */
function assertReady() {
  if (!initPromise) {
    throw new Error('BGW context is not initialized. Call await bgw.init() first.');
  }
}

/**
 * Generates a random field element (Fr) using a Cryptographically Secure Pseudo-Random Number Generator.
 */
function randomFr() {
  assertReady();
  const x = new mcl.Fr();
  x.setByCSPRNG();
  return x;
}

/**
 * Deserializes a field element (Fr) from a hex string.
 */
function frFromHex(hex) {
  assertReady();
  const x = new mcl.Fr();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

/**
 * Hashes an arbitrary value (with an optional label) to a field element (Fr) using SHA-256.
 */
function hashToFr(value, label = 'fr') {   //code that generate the hashsing
  assertReady();
  const digest = crypto
    .createHash('sha256')
    .update(`${DOMAIN}:${label}:`)
    .update(Buffer.isBuffer(value) ? value : String(value))
    .digest('hex');
  const x = new mcl.Fr();
  x.setStr(digest, 16);
  return x;
}

/**
 * Generates a G1 generator point by hashing a domain-separated label and mapping it to the G1 curve.
 */
function generatorG1(label = 'g1') {
  assertReady();
  return mcl.hashAndMapToG1(`${DOMAIN}:${label}`);
}

/**
 * Generates a G2 generator point by hashing a domain-separated label and mapping it to the G2 curve.
 */
function generatorG2(label = 'g2') {
  assertReady();
  return mcl.hashAndMapToG2(`${DOMAIN}:${label}`);
}

/**
 * Returns the identity element (zero) of the G1 group.
 */
function oneG1() {
  assertReady();
  const z = new mcl.G1();
  z.clear();
  return z;
}

/**
 * Returns the identity element (zero) of the G2 group.
 */
function oneG2() {
  assertReady();
  const z = new mcl.G2();
  z.clear();
  return z;
}

/**
 * Serializes a field element (Fr) to a hex string.
 */
function serializeFr(x) {
  return x.serializeToHexStr();
}

/**
 * Serializes a G1 element to a hex string.
 */
function serializeG1(x) {
  return x.serializeToHexStr();
}

/**
 * Serializes a G2 element to a hex string.
 */
function serializeG2(x) {
  return x.serializeToHexStr();
}

/**
 * Serializes a GT element to a hex string.
 */
function serializeGT(x) {
  return x.serializeToHexStr();
}

/**
 * Deserializes a G1 element from a hex string.
 */
function deserializeG1(hex) {
  assertReady();
  const x = new mcl.G1();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

/**
 * Deserializes a G2 element from a hex string.
 */
function deserializeG2(hex) {
  assertReady();
  const x = new mcl.G2();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

/**
 * Deserializes a GT element from a hex string.
 */
function deserializeGT(hex) {
  assertReady();
  const x = new mcl.GT();
  x.deserializeHexStr(strip0x(hex));
  return x;
}

/**
 * Strips the '0x' prefix from a hex string if present.
 */
function strip0x(hex) {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected a hex string.');
  }
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

/**
 * Normalizes an input value into a Buffer, handling strings, Buffers, null, and objects.
 */
function normalizeBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value == null) return Buffer.alloc(0);
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  return Buffer.from(JSON.stringify(value), 'utf8');
}

/**
 * Derives a symmetric key from a GT element using HMAC-based Key Derivation Function (HKDF).
 */
function kdfFromGT(gt, info = 'payload') {
  const ikm = Buffer.from(serializeGT(gt), 'hex');
  const salt = crypto.createHash('sha256').update(`${DOMAIN}:salt`).digest();
  return crypto.hkdfSync('sha256', ikm, salt, `${DOMAIN}:${info}`, 32);
}

/**
 * Encrypts plaintext using AES-256-GCM with the provided key and optional Additional Authenticated Data (AAD).
 */
function aesGcmEncrypt(key, plaintext, aad) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const aadBuffer = normalizeBuffer(aad);
  if (aadBuffer.length) cipher.setAAD(aadBuffer);
  const ciphertext = Buffer.concat([cipher.update(normalizeBuffer(plaintext)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: 'AES-256-GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

/**
 * Decrypts AES-256-GCM encrypted data using the provided key and optional AAD.
 */
function aesGcmDecrypt(key, encrypted, aad) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'base64')
  );
  const aadBuffer = normalizeBuffer(aad);
  if (aadBuffer.length) decipher.setAAD(aadBuffer);
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final(),
  ]);
}

/**
 * Asserts that the provided value is a safe positive integer.
 */
function assertPositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

/**
 * Asserts that a recipient ID is valid and within the expected range of public parameter n.
 */
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
  normalizeBuffer,
  assertPositiveInteger,
  assertRecipientId,
};

module.exports = api;
