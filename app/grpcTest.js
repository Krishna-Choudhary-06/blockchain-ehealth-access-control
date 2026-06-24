const grpc = require('@grpc/grpc-js');

const client = new grpc.Client(
  'localhost:7051',
  grpc.credentials.createSsl()
);

client.waitForReady(
  Date.now() + 5000,
  (err) => {
    if (err) {
      console.error('FAILED');
      console.error(err);
    } else {
      console.log('CONNECTED TO PEER');
    }
    client.close();
  }
);