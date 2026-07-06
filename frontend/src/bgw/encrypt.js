'use strict';

const ctx = require('./context');

function deserializePublicKey(publicKey) {
  if (!publicKey || publicKey.scheme !== 'BGW05') {
    throw new Error('Expected a BGW05 public key.');
  }
  const gPowers = {};
  for (const [i, hex] of Object.entries(publicKey.gPowers || {})) {
    gPowers[Number(i)] = ctx.deserializeG1(hex);
  }
  const hPowers = {};
  for (const [i, hex] of Object.entries(publicKey.hPowers || {})) {
    hPowers[Number(i)] = ctx.deserializeG2(hex);
  }
  return {
    n: publicKey.n,
    g: ctx.deserializeG1(publicKey.g),
    h: ctx.deserializeG2(publicKey.h),
    v: ctx.deserializeG1(publicKey.v),
    gPowers,
    hPowers,
  };
}

function normalizeRecipients(recipientIds, n) {
  const ids = [...new Set(recipientIds.map(Number))].sort((a, b) => a - b);
  if (ids.length === 0) {
    throw new Error('BGW encryption requires at least one recipient.');
  }
  ids.forEach((id) => ctx.assertRecipientId(id, n));
  return ids;
}

function computeHeader(publicKey, recipientIds, t) {
  const pk = deserializePublicKey(publicKey);
  const recipients = normalizeRecipients(recipientIds, pk.n);

  // BGW header component C0 = h^t.
  const c0 = ctx.mcl.mul(pk.h, t);

  // BGW header component C1 = (v * product_{j in S} g_{n+1-j})^t.
  let c1Base = pk.v;
  for (const j of recipients) {
    const index = pk.n + 1 - j;
    if (!pk.gPowers[index]) {
      throw new Error(`Missing public g_${index} needed for recipient ${j}.`);
    }
    c1Base = ctx.mcl.add(c1Base, pk.gPowers[index]);
  }
  const c1 = ctx.mcl.mul(c1Base, t);

  // Session secret K = e(g_n, h_1)^t = e(g, h)^(alpha^(n+1) * t).
  const keyGt = ctx.mcl.pow(ctx.mcl.pairing(pk.gPowers[pk.n], pk.hPowers[1]), t);

  return {
    recipients,
    c0,
    c1,
    keyGt,
  };
}

async function encrypt(publicKey, recipientIds, plaintext, options = {}) {
  await ctx.init();

  const t = options.t ? ctx.frFromHex(options.t) : ctx.randomFr();
  const computed = computeHeader(publicKey, recipientIds, t);
  const header = {
    scheme: 'BGW05',
    curve: 'BLS12-381',
    n: publicKey.n,
    recipientIds: computed.recipients,
    c0: ctx.serializeG2(computed.c0),
    c1: ctx.serializeG1(computed.c1),
  };

  const key = ctx.kdfFromGT(computed.keyGt, options.info || 'payload');
  const encryptedPayload = ctx.aesGcmEncrypt(
  key,
  plaintext,
  options.aad || null
);

  const result = {
    header,
    encryptedPayload,
  };
  if (options.exportUpdateToken) {
    result.updateToken = ctx.serializeFr(t);
  }
  return result;
}

async function encapsulate(publicKey, recipientIds, options = {}) {
  await ctx.init();
  const t = options.t ? ctx.frFromHex(options.t) : ctx.randomFr();
  const computed = computeHeader(publicKey, recipientIds, t);
  const header = {
    scheme: 'BGW05',
    curve: 'BLS12-381',
    n: publicKey.n,
    recipientIds: computed.recipients,
    c0: ctx.serializeG2(computed.c0),
    c1: ctx.serializeG1(computed.c1),
  };
  const result = {
    header,
    key: ctx.kdfFromGT(computed.keyGt, options.info || 'payload'),
  };
  if (options.exportUpdateToken) {
    result.updateToken = ctx.serializeFr(t);
  }
  return result;
}

module.exports = {
  encrypt,
  encapsulate,
  computeHeader,
  deserializePublicKey,
  normalizeRecipients,
};
