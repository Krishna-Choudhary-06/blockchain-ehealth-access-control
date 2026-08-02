'use strict';

const crypto = require('crypto');
const mcl = require('mcl-wasm');

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

function hashToFr(value, label = 'fr') {
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

function generatorG1(label = 'g1') {
  assertReady();
  return mcl.hashAndMapToG1(`${DOMAIN}:${label}`);
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

function normalizeBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value == null) return Buffer.alloc(0);
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  return Buffer.from(JSON.stringify(value), 'utf8');
}

function kdfFromGT(gt, info = 'payload') {
  const ikm = Buffer.from(serializeGT(gt), 'hex');
  const salt = crypto.createHash('sha256').update(`${DOMAIN}:salt`).digest();
  return crypto.hkdfSync('sha256', ikm, salt, `${DOMAIN}:${info}`, 32);
}

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
  normalizeBuffer,
  assertPositiveInteger,
  assertRecipientId,
};

module.exports = api;
