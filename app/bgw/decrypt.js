'use strict';

const ctx = require('./context');
const { deserializePublicKey } = require('./encrypt');

function deriveGT(publicKey, header, privateKey) {
  const pk = deserializePublicKey(publicKey);

  if (!header || header.scheme !== 'BGW05') {
    throw new Error('Expected a BGW05 header.');
  }
  if (!privateKey || privateKey.scheme !== 'BGW05') {
    throw new Error('Expected a BGW05 private key.');
  }

  const i = Number(privateKey.recipientId);
  const recipients = [...new Set((header.recipientIds || []).map(Number))];
  ctx.assertRecipientId(i, pk.n);

  if (!recipients.includes(i)) {
    throw new Error(`Recipient ${i} is not included in this BGW header.`);
  }

  const c0 = ctx.deserializeG2(header.c0);
  const c1 = ctx.deserializeG1(header.c1);
  const dI = ctx.deserializeG1(privateKey.d);

  if (!pk.hPowers[i]) {
    throw new Error(`Missing public h_${i} needed for decryption.`);
  }

  // Numerator: e(C1, h_i)
  // = e((v * product_{j in S} g_{n+1-j})^t, h_i).
  const numerator = ctx.mcl.pairing(c1, pk.hPowers[i]);

  // Denominator: e(d_i * product_{j in S, j != i} g_{n+1-j+i}, C0)
  // This cancels every exponent term except alpha^(n+1).
  let denominatorBase = dI;
  for (const j of recipients) {
    if (j === i) continue;
    const index = pk.n + 1 - j + i;
    if (!pk.gPowers[index]) {
      throw new Error(`Missing public g_${index} needed for recipient ${i}.`);
    }
    denominatorBase = ctx.mcl.add(denominatorBase, pk.gPowers[index]);
  }
  const denominator = ctx.mcl.pairing(denominatorBase, c0);

  return ctx.mcl.div(numerator, denominator);
}

async function decrypt(publicKey, header, privateKey, encryptedPayload, options = {}) {
  await ctx.init();

  const keyGt = deriveGT(publicKey, header, privateKey);
  const key = ctx.kdfFromGT(keyGt, options.info || 'payload');
  return ctx.aesGcmDecrypt(
  key,
  encryptedPayload,
  options.aad ?? null
);
}

module.exports = {
  decrypt,
  deriveGT,
};
