# Base Paper Experimental Specification

**Reference Paper:**  
*An Adaptive Blockchain-Enabled Access Control Framework for Secure and Privacy-Preserving E-Health Data Sharing*  
**Authors:** Zohre Notash, Shahram Jamali, Reza Fotohi  
**Journal:** *Blockchain: Research and Applications*, April 2026.

---

## 1. Hardware Setup (Reference vs. Local)
- **Paper Configuration:** Multi-node distributed enterprise cluster environment with dedicated bare-metal servers for Hyperledger Fabric Orderers, Endorsing Peers, IPFS cluster, and client workload generators.
- **Local Replication Hardware:**
  - OS: Windows 11 + WSL2 (Ubuntu 24.04 LTS x86_64, Linux kernel 5.15.167)
  - CPU: 13th Gen Intel(R) Core(TM) i5-13420H (8 physical cores: 4 Performance + 4 Efficient, 12 logical threads)
  - RAM: ~10 GB available to WSL2 and Docker experiments
  - GPU: NVIDIA GeForce RTX 2050 (4 GB GDDR6 VRAM, CUDA 13.1)
  - Storage: 950 GB free NVMe SSD
- **Disparity Note:** The hardware differences are strictly recorded in `experiment_metadata.json` and reported as a research limitation. Raw local measurements are never altered to emulate paper hardware numbers.

---

## 2. Blockchain Configuration
- **Platform:** Hyperledger Fabric 2.x
- **Consensus / Ordering:** Raft consensus (`orderer.example.com:7050`)
- **Channel:** `healthchannel`
- **Chaincode:** `healthcontract` (Smart contracts: `UserRegistry`, `PrivacyLevel`, `DataStorage`, `DataAccess`)
- **Block Time / BatchTimeout:** 2.0s

---

## 3. Block Sizes
Evaluated across 4 discrete ordering batch configurations:
- 5 transactions per block
- 10 transactions per block
- 15 transactions per block
- 20 transactions per block
Verified via live channel configuration block (`MaxMessageCount`).

---

## 4. Number of Users / Client Scaling
- Evaluated client range: **10, 20, 30, 40, 50, 60, 70, 80, 90, 100** concurrent users.
- Role distribution conforms to the paper's 4 privacy tiers (`L0` to `L3`):
  - `L0`: Doctor / Admin (Highest privilege)
  - `L1`: Nurse / Laboratory / Provider
  - `L2`: Medical Staff / Authenticated Caregiver
  - `L3`: Patient / Public Record

---

## 5. Transaction Rates
- Paper range: 100 to 850 TPS offered load.
- Local accommodation: Due to single-laptop WSL2 resource limits, offered load is systematically scaled from 10 to 100 concurrent transaction requests, with throughput measured as committed TPS on the ledger.

---

## 6. Latency Definition
Transaction latency is defined strictly as the elapsed time from transaction proposal submission by the client until successful confirmation and commitment on the ledger:
$$\text{Latency} = T_{\text{commit}} - T_{\text{submit}}$$
For each transaction, timestamp logs capture `submit_timestamp` and `commit_timestamp`, from which `latency_ms` is calculated. Reported summary statistics: Mean, Median, Min, Max, Standard Deviation, and 95th Percentile (P95).

---

## 7. Throughput Definition
Throughput is defined strictly as the number of valid, successfully committed transactions per second:
$$\text{Throughput (TPS)} = \frac{N_{\text{committed}}}{\Delta T_{\text{total}}}$$
Offered transaction rate and committed throughput are strictly separated. Transactions that fail endorsement, ordering, or timeout are recorded as failed and excluded from valid throughput.

---

## 8. Communication Overhead Definition
Total byte volume of network messages exchanged across the transaction lifecycle:
- Client to Node.js backend HTTP payload (Request + Response bytes)
- IPFS upload/download byte transfer
- Fabric endorsement proposals, read-write sets, and block delivery
- *Local limitation:* In single-host Docker environments, internal container veth traffic is reported as application/HTTP + IPFS payload bytes, clearly distinguished from wire-level Fabric gossip.

---

## 9. Computation Overhead Definition
The processing time (in milliseconds or CPU core utilization %) consumed during:
- Cryptographic key generation / encapsulation
- Client/backend encryption / BGW header computation
- Smart contract execution by peer containers
- Block validation and MVCC state commit

---

## 10. Number / Repetition Methodology
- Each workload and block size configuration is executed for a configurable number of repetitions (default: 3 to 5 runs).
- Before recording measurements, a pre-flight warm-up phase (5 transactions) is executed and its measurements discarded to eliminate JVM/Node.js JIT and cold-cache effects.

---

## 11. Figure 2 Methodology (Latency vs. Transaction Load)
- Four-panel evaluation of Latency (ms) vs. Transaction Load across:
  - (a) Block Size 5
  - (b) Block Size 10
  - (c) Block Size 15
  - (d) Block Size 20
- Plotting: X = Transaction Load / Rate, Y = Average Latency (ms). Generated from empirical runs.

---

## 12. Figure 3 Methodology (Throughput vs. Transaction Load)
- Four-panel evaluation of Committed Throughput (TPS) vs. Offered Transaction Load across:
  - (a) Block Size 5, Low Transaction Rate
  - (b) Block Size 5, High Transaction Rate
  - (c) Block Size 10, Low Transaction Rate
  - (d) Block Size 10, High Transaction Rate

---

## 13. Figure 4 Methodology (Communication Overhead vs. Transaction Load)
- Four-panel evaluation of Communication Overhead across the same 4 configurations:
  - Block 5 Low Rate, Block 5 High Rate, Block 10 Low Rate, Block 10 High Rate.
  - Measured in Kilobytes / Megabytes transferred.

---

## 14. Figure 5 Methodology (Computation Overhead vs. Transaction Load)
- Four-panel evaluation of Computation Overhead (CPU % and execution milliseconds) across the same 4 configurations.

---

## 15. Figure 6 Methodology (User Scalability)
Evaluates system scaling as user/client count increases from 10 to 100:
- **Figure 6a:** Average Latency vs. Number of Users
- **Figure 6b:** Committed Throughput vs. Number of Users
- **Figure 6c:** Communication Overhead vs. Number of Users

---

## 16. Table 9 Methodology (Storage & Overhead Comparison)
Quantifies ledger storage growth (on-chain metadata bytes) versus off-chain IPFS payload size and storage expansion ratio across block sizes.

---

## 17. Assumptions and Defensible Local Adaptations
1. **Cluster vs. Laptop:** The base paper ran on an enterprise server cluster; our local single-node testbed uses Docker Desktop with 10 GB WSL RAM. Trends and relative behaviors are evaluated faithfully.
2. **Maximum Load:** 850 TPS cannot be sustained by a single laptop Docker engine without resource exhaustion. We evaluate up to the laptop's empirical saturation point (10–100 concurrency).
3. **Fabric Wire Traffic:** Low-level gRPC socket streams within the Docker virtual bridge are characterized via measurable application wire bytes (HTTP + IPFS).
