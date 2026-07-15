'use strict';

/**
 * Paper-aligned benchmark runner for blockchain e-health access control.
 *
 * Paper requirements:
 *   Block sizes:  [5, 10, 15, 20]
 *   Users:        [10, 25, 50, 75, 100]
 *   Transaction rates: [100, 250, 500, 850] TPS
 *   Runs:         >=3 per scenario
 *   Report:       min, max, avg, stddev
 *
 * Flags:
 *   --bgw-only   BGW crypto + overhead only (no external deps)
 *   --quick      1 scenario per parameter dimension
 *   --all        full cross-product (can be slow)
 *   --no-fabric  skip Fabric-dependent tests
 *   --no-ipfs    skip IPFS-dependent tests
 */

const path = require('path');
const { ensureResultsDir, reportToCsv, reportToJson } = require('./lib/helpers');
const { formatHeader } = require('./lib/stats');
const bgwBench = require('./bgwBenchmark');
const overheadBench = require('./overheadBenchmark');

// Paper matching scenario parameters
const BLOCK_SIZES = [5, 10, 15, 20];
const CONCURRENCIES = [10, 25, 50, 75, 100];
const TPSS = [100, 250, 500, 850];
const RUNS = 3;

async function main() {
  const args = process.argv.slice(2);
  const noFabric = args.includes('--no-fabric');
  const noIpfs = args.includes('--no-ipfs');
  const bgwOnly = args.includes('--bgw-only');
  const quick = args.includes('--quick');
  const runAll = args.includes('--all');

  // In quick mode, use a subset; in paper mode use full matrix (minus
  // cross-product explosion); in --all do the full cross-product.
  const bsList = quick ? [5, 10] : BLOCK_SIZES;
  const ccList = quick ? [10, 50] : CONCURRENCIES;
  const tpsList = quick ? [250, 500] : TPSS;

  ensureResultsDir();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Blockchain e-Health Access Control — Paper-Aligned Suite  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nPaper Parameters:`);
  console.log(`  Block sizes:       ${JSON.stringify(bsList)}`);
  console.log(`  Concurrent users:  ${JSON.stringify(ccList)}`);
  console.log(`  Transaction rates: ${JSON.stringify(tpsList)} TPS`);
  console.log(`  Runs per scenario: ${RUNS}`);
  console.log(`  Mode:              ${bgwOnly ? 'BGW-only (offline)' : noFabric ? 'no-Fabric' : noIpfs ? 'no-IPFS' : 'full'}`);
  console.log(`  Start:             ${new Date().toISOString()}\n`);

  const summary = {
    startedAt: new Date().toISOString(),
    config: {
      paper: { blockSizes: bsList, concurrencies: ccList, tpss: tpsList, runs: RUNS },
      flags: { bgwOnly, noFabric, noIpfs, quick, runAll }
    },
    results: {}
  };

  // ──────────────────────────────────────────────
  // PHASE 1: BGW Crypto Microbenchmarks
  // Tests: setup, keygen, encrypt, decrypt,
  //        updateHeader, encapsulate, deriveGT
  // Recipient counts: 1..100
  // Correctness: authorized pass, unauthorized fail
  // ──────────────────────────────────────────────
  console.log('═══ PHASE 1: BGW Crypto Microbenchmarks ═══\n');
  const bgwRows = await bgwBench.runBgwBenchmark();
  summary.results.bgw = bgwRows;

  // ──────────────────────────────────────────────
  // PHASE 2: Overhead Metrics
  // Communication: envelope bytes, request/response size estimates
  // Computation: crypto time breakdown, AES-GCM overhead
  // ──────────────────────────────────────────────
  console.log('═══ PHASE 2: Overhead Metrics ═══\n');
  const overheadRows = await overheadBench.runOverheadBenchmark();
  summary.results.overhead = overheadRows;

  if (!bgwOnly) {
    let fabricAvail = false;
    let ipfsAvail = false;

    try {
      const { getContract } = require('../services/fabricService');
      await getContract();
      fabricAvail = true;
    } catch (e) {
      console.log('  ⚠ Fabric network unavailable. Skipping Fabric benchmarks.\n');
    }

    try {
      const ipfs = require('../services/ipfsService');
      await ipfs.uploadFile(Buffer.from('ping'));
      ipfsAvail = true;
    } catch (e) {
      console.log('  ⚠ IPFS daemon unavailable. Skipping IPFS benchmarks.\n');
    }

    // ──────────────────────────────────────────────
    // PHASE 3: Fabric Workflow
    // Experiments:
    //   Exp1: Block size vs latency (users=50, tps=500)
    //   Exp2: Concurrency vs throughput (block=10, tps=500)
    //   Exp3: TPS vs throughput (block=10, users=50)
    //   Exp4: Block × TPS matrix (users=50)
    // ──────────────────────────────────────────────
    if (fabricAvail && !noFabric) {
      console.log('═══ PHASE 3: Fabric Workflow Benchmarks ═══\n');
      const { runFabricBenchmark } = require('./fabricBenchmark');
      await runFabricBenchmark({ runs: RUNS, scenarioTag: 'paper' });
    }

    // ──────────────────────────────────────────────
    // PHASE 4: IPFS Benchmarks
    // Payload sizes: 256B to 1MB
    // Metrics: upload, download, hash verify, decrypt
    // ──────────────────────────────────────────────
    if (ipfsAvail && !noIpfs) {
      console.log('═══ PHASE 4: IPFS + Envelope Benchmarks ═══\n');
      const { runIpfsBenchmark } = require('./ipfsBenchmark');
      await runIpfsBenchmark();
    }

    // ──────────────────────────────────────────────
    // PHASE 5: End-to-End Workflow
    // Block sizes: [5,10,15,20]
    // Metrics: phase breakdown, batch storeHash
    // ──────────────────────────────────────────────
    if (fabricAvail && !noFabric) {
      console.log('═══ PHASE 5: End-to-End Workflow ═══\n');
      const { runE2eBenchmark } = require('./e2eBenchmark');
      await runE2eBenchmark({ runs: RUNS, scenarioTag: 'paper' });

      // Cleanup Fabric data from benchmarks
      try {
        const { ensurePool, disconnectPool } = require('./lib/fabricPool');
        const pool = await ensurePool(1);
        const c = pool.getContract(0);
        for (const ns of ['UserRegistry', 'PrivacyLevel', 'DataStorage', 'DataAccess']) {
          try { await c.submitTransaction(`${ns}:wipeAll`); } catch (e) { /* ignore */ }
        }
        await disconnectPool();
      } catch (e) { /* ignore cleanup */ }
    }

    // Run E2E even without IPFS (mock fallback handles it)
    if (fabricAvail && !noFabric && noIpfs) {
      console.log('═══ PHASE 5: End-to-End Workflow (no IPFS) ═══\n');
      const { runE2eBenchmark } = require('./e2eBenchmark');
      await runE2eBenchmark({ runs: RUNS, scenarioTag: 'paper-noipfs' });
    }
  }

  summary.completedAt = new Date().toISOString();
  const summaryPath = reportToJson('summary.json', summary);
  console.log(`\n═══ Benchmark Complete ═══`);
  console.log(`Summary: ${summaryPath}`);
  console.log(`Results: ${path.join(__dirname, 'results')}\n`);
}

main().catch(err => { console.error('Benchmark suite failed:', err); process.exit(1); });
