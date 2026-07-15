'use strict';

/**
 * Reusable Fabric gateway connection pool.
 *
 * Connections are created *sequentially* (not in parallel) to avoid
 * overwhelming the Fabric test-network's gRPC server limits when a
 * large pool (e.g. 100) is requested.
 *
 * No artificial cap is placed on pool size. If the local Fabric setup
 * cannot support the requested number of connections, ensurePool will
 * throw, and the benchmark will report the failure. This is documented
 * as a local-environment constraint in the benchmark report.
 */

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(
  process.env.HOME, 'fabric-samples', 'test-network',
  'organizations', 'peerOrganizations', 'org1.example.com',
  'connection-org1.json'
);
const walletPath = path.join(__dirname, '..', '..', 'wallet');

let pool = null;

async function ensurePool(size = 10) {
  if (pool && pool.contracts.length >= size) return pool;
  if (pool) await pool.disconnectAll();

  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const contracts = [];

  // Create connections sequentially to avoid gRPC flood rejection.
  for (let i = 0; i < size; i++) {
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet, identity: 'appUser3',
      discovery: { enabled: true, asLocalhost: true }
    });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('ehr-registration-v3');
    contracts.push({ contract, gateway });
  }

  pool = {
    getContract(index) { return contracts[index % contracts.length].contract; },
    contracts,
    size,
    async disconnectAll() {
      for (const c of contracts) await c.gateway.disconnect();
      pool = null;
    }
  };
  return pool;
}

async function disconnectPool() {
  if (pool) await pool.disconnectAll();
}

module.exports = { ensurePool, disconnectPool };
