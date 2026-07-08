import * as context from './context.js';
import { setup } from './setup.js';
import { keygen, keygenMany } from './keygen.js';
import { encrypt, encapsulate } from './encrypt.js';
import { decrypt, deriveGT } from './decrypt.js';
import { updateHeader, addRecipients, removeRecipients } from './updateHeader.js';

export function fabricIpfsEnvelope({ bgwCiphertext, ipfsCid, fabricAssetId, metadata = {} }) {
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

export async function encryptForIpfs(publicKey, recipientIds, payload, options = {}) {
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

export async function decryptFromIpfsEnvelope(publicKey, privateKey, envelope, options = {}) {
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

const bgw = {
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

export default bgw;
export {
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
};
