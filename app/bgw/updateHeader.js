'use strict';

const ctx = require('./context');
const { computeHeader, normalizeRecipients } = require('./encrypt');

async function updateHeader(publicKey, header, nextRecipientIds, options = {}) {
  await ctx.init();

  if (!header || header.scheme !== 'BGW05') {
    throw new Error('Expected a BGW05 header.');
  }

  const updateToken = options.updateToken;
  if (!updateToken) {
    throw new Error(
      'BGW headers cannot be changed from public data alone. Re-encrypt, or pass the private update token returned by encrypt(..., { exportUpdateToken: true }).'
    );
  }

  const t = ctx.frFromHex(updateToken);
  const computed = computeHeader(publicKey, normalizeRecipients(nextRecipientIds, publicKey.n), t);

  return {
    scheme: 'BGW05',
    curve: 'BLS12-381',
    n: publicKey.n,
    recipientIds: computed.recipients,
    c0: ctx.serializeG2(computed.c0),
    c1: ctx.serializeG1(computed.c1),
  };
}

async function addRecipients(publicKey, header, recipientIdsToAdd, options = {}) {
  const next = [...new Set([...(header.recipientIds || []), ...recipientIdsToAdd].map(Number))];
  return updateHeader(publicKey, header, next, options);
}

async function removeRecipients(publicKey, header, recipientIdsToRemove, options = {}) {
  const removed = new Set(recipientIdsToRemove.map(Number));
  const next = (header.recipientIds || []).map(Number).filter((id) => !removed.has(id));
  return updateHeader(publicKey, header, next, options);
}

module.exports = {
  updateHeader,
  addRecipients,
  removeRecipients,
};
