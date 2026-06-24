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

  await gateway.connect(ccp, {
  wallet,
  identity: 'admin',
  discovery: {
    enabled: true,
    asLocalhost: true
  }
});

  console.log('CONNECTED');

  const network = await gateway.getNetwork('mychannel');

  console.log('NETWORK');

  const contract = network.getContract(
    'ehr-registration-v3',
    'UserRegistry'
  );

  console.log('CONTRACT');

  const channel = network.getChannel();

  console.log("ENDORSERS:");
console.log(channel.getEndorsers());

console.log("COMMITTERS:");
console.log(channel.getCommitters());

console.log("MSPS:");
console.log(channel.getMspids());

try {
    const result =
        await contract.evaluateTransaction("getAllUsers");

    console.log("SUCCESS:");
    console.log(result.toString());
} catch(err) {
    console.log("ERROR OBJECT:");
    console.dir(err, { depth: null });
}
})();