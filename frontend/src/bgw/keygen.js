import * as ctx from './context.js';

export async function keygen(masterSecret, recipientId, publicKey) {
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

export async function keygenMany(masterSecret, recipientIds, publicKey) {
  return Promise.all(recipientIds.map((id) => keygen(masterSecret, id, publicKey)));
}
