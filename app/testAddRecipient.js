'use strict';

const bgw = require('./services/broadcast');

async function main() {
  const { publicKey, masterSecret } =
    await bgw.setup({ n: 20 });

  const sk1 = await bgw.keygen(masterSecret, 1, publicKey);
  const sk2 = await bgw.keygen(masterSecret, 2, publicKey);
  const sk3 = await bgw.keygen(masterSecret, 3, publicKey);

  const enc = await bgw.encapsulate(
    publicKey,
    [1, 2],
    { exportUpdateToken: true }
  );

  const updatedHeader =
    await bgw.addRecipients(
      publicKey,
      enc.header,
      [3],
      {
        updateToken: enc.updateToken
      }
    );

  const k1 = Buffer.from(
    bgw.kdfFromGT(
      bgw.deriveGT(publicKey, updatedHeader, sk1)
    )
  ).toString('hex');

  const k2 = Buffer.from(
    bgw.kdfFromGT(
      bgw.deriveGT(publicKey, updatedHeader, sk2)
    )
  ).toString('hex');

  const k3 = Buffer.from(
    bgw.kdfFromGT(
      bgw.deriveGT(publicKey, updatedHeader, sk3)
    )
  ).toString('hex');

  console.log('User1:', k1);
  console.log('User2:', k2);
  console.log('User3:', k3);

  console.log(
    'Equal:',
    k1 === k2 && k2 === k3
  );
}

main().catch(console.error);