'use strict';

const ctx = require('./context');

function powerLadder(base, alpha, max) {
  const powers = {};
  let alphaPower = alpha;
  for (let i = 1; i <= max; i += 1) {
    powers[i] = ctx.mcl.mul(base, alphaPower);
    alphaPower = ctx.mcl.mul(alphaPower, alpha);
  }
  return powers;
}

function serializeLadder(ladder, serializer, skipIndex) {
  return Object.fromEntries(
    Object.entries(ladder)
      .filter(([i]) => Number(i) !== skipIndex)
      .map(([i, point]) => [i, serializer(point)])
  );
}

async function setup(options = {}) {
  await ctx.init();

  const n = options.n || options.maxUsers;
  ctx.assertPositiveInteger(n, 'n');

  const alpha = options.alpha ? ctx.frFromHex(options.alpha) : ctx.randomFr();
  const gamma = options.gamma ? ctx.frFromHex(options.gamma) : ctx.randomFr();

  const g = options.g ? ctx.deserializeG1(options.g) : ctx.generatorG1('public-g');
  const h = options.h ? ctx.deserializeG2(options.h) : ctx.generatorG2('public-h');

  const gPowers = powerLadder(g, alpha, 2 * n);
  const hPowers = powerLadder(h, alpha, n);

  // BGW setup publishes v = g^gamma. User i receives d_i = g_i^gamma.
  const v = ctx.mcl.mul(g, gamma);

  return {
    publicKey: {
      scheme: 'BGW05',
      curve: 'BLS12-381',
      n,
      g: ctx.serializeG1(g),
      h: ctx.serializeG2(h),
      v: ctx.serializeG1(v),
      // BGW omits g_{n+1}; it is the hidden exponent used in the session key.
      gPowers: serializeLadder(gPowers, ctx.serializeG1, n + 1),
      hPowers: serializeLadder(hPowers, ctx.serializeG2),
    },
    masterSecret: {
      scheme: 'BGW05',
      curve: 'BLS12-381',
      n,
      alpha: ctx.serializeFr(alpha),
      gamma: ctx.serializeFr(gamma),
    },
  };
}

module.exports = {
  setup,
};
