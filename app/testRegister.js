const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

(async () => {

  const ccp = JSON.parse(
    fs.readFileSync(
      process.env.HOME +
      '/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json'
    )
  );

  const wallet =
    await Wallets.newFileSystemWallet('./wallet');

  const gateway = new Gateway();

  await gateway.connect(ccp,{
  wallet,
  identity:'appUser3',
  discovery:{
    enabled:true,
    asLocalhost:true
  }
});

  const network =
    await gateway.getNetwork('mychannel');
  const channel = network.getChannel();

console.log(
  'ENDORSERS:',
  channel.getEndorsers().map(e => e.name)
);

console.log(
  'COMMITTERS:',
  channel.getCommitters().map(c => c.name)
);

  const contract =
    network.getContract('ehr-registration-v3');

  try {

    const result =
      await contract.submitTransaction(
        'registerUser',
        'patient999',
        'pubkey999',
        'PATIENT'
      );

    console.log(result.toString());

  } catch(err) {

    console.error("REGISTER FAILED");
    console.error(err);

  }

  gateway.disconnect();

})();