'use strict';

const ctx = require('./context');

/**
 * Generates a private key for a specific recipient ID in the BGW scheme.
 * Computes the user's private key component d_i = g^(gamma * alpha^i) using the master secret parameters.
 */
async function keygen(masterSecret, recipientId, publicKey) {
  await ctx.init();

  if (!masterSecret || masterSecret.scheme !== 'BGW05') {
    throw new Error('Expected a BGW05 master secret.');
  }

  const n = publicKey ? publicKey.n : masterSecret.n;
  ctx.assertRecipientId(recipientId, n);

  const alpha = ctx.frFromHex(masterSecret.alpha);
  const gamma = ctx.frFromHex(masterSecret.gamma);
  const g = publicKey && publicKey.g ? ctx.deserializeG1(publicKey.g) : ctx.generatorG1('public-g');

  let exponent = alpha;
  for (let i = 1; i < recipientId; i += 1) {
    exponent = ctx.mcl.mul(exponent, alpha);
  }

  // BGW private key for user i: d_i = g_i^gamma = g^(gamma * alpha^i).
  const gammaAlphaI = ctx.mcl.mul(gamma, exponent);
  const dI = ctx.mcl.mul(g, gammaAlphaI);

  return {
    scheme: 'BGW05',
    curve: 'BLS12-381',
    n,
    recipientId,
    d: ctx.serializeG1(dI),
  };
}

/**
 * Generates private keys for multiple recipient IDs concurrently.
 * Useful for bulk provisioning of users in the broadcast system.
 */
async function keygenMany(masterSecret, recipientIds, publicKey) {
  return Promise.all(recipientIds.map((id) => keygen(masterSecret, id, publicKey)));
}

module.exports = {
  keygen,
  keygenMany,
};
