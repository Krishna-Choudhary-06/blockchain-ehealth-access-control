'use strict';

const bgw = require('./services/broadcast');

async function main() {
    const { publicKey, masterSecret } =
        await bgw.setup({ n: 20 });

    const sk1 =
        await bgw.keygen(masterSecret, 1, publicKey);

    const result =
        await bgw.encapsulate(
            publicKey,
            [1,2,3],
            { exportUpdateToken: true }
        );

    const gt1 =
        bgw.deriveGT(
            publicKey,
            result.header,
            sk1
        );

    console.log(
        'Encrypt key:',
        Buffer.from(result.key).toString('hex')
    );

    console.log(
        'Decrypt key:',
        Buffer.from(
            bgw.kdfFromGT(gt1)
        ).toString('hex')
    );
}

main().catch(console.error);