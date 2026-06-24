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
    identity:'admin',
    discovery:{enabled:false}
  });

  const network =
    await gateway.getNetwork('mychannel');

  const channel = network.getChannel();

console.log("ENDORSERS:");
console.log(channel.getEndorsers());

console.log("COMMITTERS:");
console.log(channel.getCommitters());

console.log("MSPs:");
console.log(channel.getMspids());

console.log("TARGET ENDORSERS:");
console.log(channel.getTargetEndorsers());

console.log("TARGET COMMITTERS:");
console.log(channel.getTargetCommitters());

gateway.disconnect();

  
})();