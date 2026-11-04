# Paper Alignment Report

| Paper Experiment | Implemented | Actual Data | Difference | Reason |
|---|---|---|---|---|
| **Figure 2: Latency vs. Load (Block 5, 10, 15, 20)** | **COMPLETE** | Yes, measured | Offered load evaluated across 10 to 100 concurrent requests instead of 850 TPS | Single-laptop Docker engine resource ceiling |
| **Figure 3: Throughput vs. Load (4 panels)** | **COMPLETE** | Yes, measured | Peak TPS reflects local Core i5 rather than multi-node cluster | Measured actual committed TPS without simulation |
| **Figure 4: Communication Overhead (4 panels)** | **PARTIAL** | Yes, measured | Reports HTTP wire bytes + IPFS payload bytes rather than intra-container gRPC wiretap | Single-host virtual bridge wiretap limitations |
| **Figure 5: Computation Overhead (4 panels)** | **COMPLETE** | Yes, measured | CPU utilization % and execution timing measured via psutil and high-res timers | Standardized process and system metrics collection |
| **Figure 6: Scalability (Users 10 -> 100)** | **COMPLETE** | Yes, measured | Evaluated across 10 to 100 users across 4 privacy tiers | Direct user scale execution on local network |
| **Table 9: Storage Overhead & Ledger Growth** | **COMPLETE** | Yes, measured | Measures on-chain metadata bytes vs. off-chain IPFS payload size | Direct ledger state size measurement |
| **BGW vs. Baseline Repeated Encryption Sharing** | **COMPLETE** | Yes, measured | Compares real BGW header update vs. real AES-256 + RSA re-encryption | Empirical comparison of file sharing overhead |
