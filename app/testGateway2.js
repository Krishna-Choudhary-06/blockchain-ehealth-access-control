const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

(async () => {
  try {
    const ccp = JSON.parse(
      fs.readFileSync(
        process.env.HOME +
        '/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json'
      )
    );

    console.log(
      'TLS CERT LENGTH:',
      ccp.peers['peer0.org1.example.com']
         .tlsCACerts.pem.length
    );

    const wallet =
      await Wallets.newFileSystemWallet('./wallet');

    console.log(
      'WALLET:',
      await wallet.list()
    );

    const gateway = new Gateway();

    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: false }
    });

    console.log('CONNECTED');

    const network =
      await gateway.getNetwork('mychannel');

    console.log('NETWORK');

    const channel = network.getChannel();

    console.log(
      'ENDORSERS:',
      channel.getEndorsers().map(e => e.name)
    );

    const peers = channel.getEndorsers();

    for (const p of peers) {
      console.log(
        p.name,
        p.endpoint?.url || p.endpoint
      );
    }

    gateway.disconnect();
  }
  catch(err) {
    console.error(err);
  }
})();