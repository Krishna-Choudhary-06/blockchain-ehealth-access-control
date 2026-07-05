'use strict';

const bgw = require('./services/broadcast');

async function main() {
  const { publicKey, masterSecret } =
    await bgw.setup({ n: 20 });

  const sk1 =
    await bgw.keygen(masterSecret, 1, publicKey);

  const enc =
    await bgw.encapsulate(
      publicKey,
      [1,2,3],
      { exportUpdateToken: true }
    );

  const k1 =
    bgw.kdfFromGT(
      bgw.deriveGT(
        publicKey,
        enc.header,
        sk1
      )
    );

  const updated =
    await bgw.removeRecipients(
      publicKey,
      enc.header,
      [3],
      {
        updateToken: enc.updateToken
      }
    );

  const k2 =
    bgw.kdfFromGT(
      bgw.deriveGT(
        publicKey,
        updated.header || updated,
        sk1
      )
    );

  console.log('before:', k1.toString('hex'));
  console.log('after :', k2.toString('hex'));
  console.log(
    'equal:',
    k1.equals(k2)
  );
}

main().catch(console.error);