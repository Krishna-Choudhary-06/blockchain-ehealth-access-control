'use strict';

const bgw = require('./services/broadcast');

async function main() {

  const { publicKey } =
    await bgw.setup({ n: 100 });

  for (const count of [1,5,10,20,50]) {

    const recipients =
      Array.from(
        { length: count },
        (_, i) => i + 1
      );

    const result =
      await bgw.encapsulate(
        publicKey,
        recipients
      );

    const size =
      Buffer.byteLength(
        JSON.stringify(result.header)
      );

    console.log(
      `Recipients=${count}, HeaderSize=${size}`
    );
  }
}

main().catch(console.error);