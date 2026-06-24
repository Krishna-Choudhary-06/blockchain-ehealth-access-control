const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

(async () => {
  const ccp = JSON.parse(
    fs.readFileSync(
      process.env.HOME +
      '/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json'
    )
  );

  const wallet = await Wallets.newFileSystemWallet('./wallet');

  const gateway = new Gateway();

  await gateway.connect(ccp,{
    wallet,
    identity:'admin',
    discovery:{ enabled:false }
  });

  const network = await gateway.getNetwork('mychannel');

  console.log("CONNECTED");

  try {
    const result =
      await network.getContract('qscc')
        .evaluateTransaction(
          'GetChainInfo',
          'mychannel'
        );

    console.log(result.toString());
  } catch(err) {
    console.error(err);
  }

  gateway.disconnect();
})();