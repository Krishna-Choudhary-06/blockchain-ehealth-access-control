const grpc = require('@grpc/grpc-js');
const fs = require('fs');

const pem = fs.readFileSync(
  process.env.HOME +
  '/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem'
);

const client = new grpc.Client(
  'localhost:7051',
  grpc.credentials.createSsl(pem)
);

client.waitForReady(
  Date.now() + 5000,
  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('TLS CONNECTION OK');
    }
    client.close();
  }
);