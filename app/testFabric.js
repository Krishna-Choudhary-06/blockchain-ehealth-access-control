const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const ccpPath = path.resolve(
      process.env.HOME,
      'fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json'
    );

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const wallet = await Wallets.newFileSystemWallet('./wallet');

    const gateway = new Gateway();

    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser3',
      discovery: { enabled: false }
    });

    console.log('CONNECTED');

    const network = await gateway.getNetwork('mychannel');

    console.log('NETWORK OK');

    const contract = network.getContract('ehr-registration-v3');

    console.log('CONTRACT OK');

    const result = await contract.evaluateTransaction('getAllUsers');

    console.log(result.toString());

    gateway.disconnect();
  } catch (e) {
    console.error('ERROR');
    console.error(e);
  }
})();