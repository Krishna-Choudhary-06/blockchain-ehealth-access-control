'use strict';

const context = require('./context');
const { setup } = require('./setup');
const { keygen, keygenMany } = require('./keygen');
const { encrypt, encapsulate } = require('./encrypt');
const { decrypt, deriveGT } = require('./decrypt');
const { updateHeader, addRecipients, removeRecipients } = require('./updateHeader');

/*
BGW equation map for this asymmetric BLS12-381 implementation:

Setup:
  Pick alpha, gamma in Fr.
  Publish g_i = g^(alpha^i), h_i = h^(alpha^i), v = g^gamma.
  Omit g_{n+1}; that hidden term is the broadcast secret.

KeyGen:
  Recipient i receives d_i = g_i^gamma = g^(gamma * alpha^i).

Encrypt to S:
  Pick t in Fr.
  C0 = h^t.
  C1 = (v * product_{j in S} g_{n+1-j})^t.
  K  = e(g_n, h_1)^t = e(g, h)^(alpha^(n+1) * t).

Decrypt for i in S:
  K = e(C1, h_i) /
      e(d_i * product_{j in S, j != i} g_{n+1-j+i}, C0).

The AES-GCM layer is only a DEM that encrypts bytes under HKDF(K). It is not
a simplified broadcast-encryption replacement.
*/
function fabricIpfsEnvelope({ bgwCiphertext, ipfsCid, fabricAssetId, metadata = {} }) {
  return {
    type: 'BGW_IPFS_HEALTHCARE_ENVELOPE',
    version: 1,
    fabricAssetId,
    ipfsCid,
    bgwHeader: bgwCiphertext.header,
    encryptedPayload: bgwCiphertext.encryptedPayload,
    updateToken: bgwCiphertext.updateToken,
    metadata,
  };
}

async function encryptForIpfs(publicKey, recipientIds, payload, options = {}) {
  const bgwCiphertext = await encrypt(
    publicKey,
    recipientIds,
    payload,
    {
        aad: null,
        info: options.info || 'ipfs-healthcare-payload',
        exportUpdateToken: options.exportUpdateToken,
    }
);
  console.log("RAW BGW RESULT:", Object.keys(bgwCiphertext));
console.log("RAW UPDATE TOKEN:", bgwCiphertext.updateToken);
  return fabricIpfsEnvelope({
    bgwCiphertext,
    ipfsCid: options.ipfsCid,
    fabricAssetId: options.fabricAssetId,
    metadata: options.metadata,
  });
}

async function decryptFromIpfsEnvelope(publicKey, privateKey, envelope, options = {}) {
  return decrypt(
    publicKey,
    envelope.bgwHeader,
    privateKey,
    envelope.encryptedPayload,
    {
        aad: null,
        info: options.info || 'ipfs-healthcare-payload',
    }
);
}

module.exports = {
  ...context,
  setup,
  keygen,
  keygenMany,
  encrypt,
  encapsulate,
  decrypt,
  deriveGT,
  updateHeader,
  addRecipients,
  removeRecipients,
  fabricIpfsEnvelope,
  encryptForIpfs,
  decryptFromIpfsEnvelope,
};
