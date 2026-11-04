# Reproducibility Notes & Execution Guide

## 1. System Requirements & Prerequisites
1. **Windows 11 + WSL2 (Ubuntu 24.04)**
2. **Docker Desktop** running with WSL2 Integration enabled.
3. **Hyperledger Fabric Test Network** running on `healthchannel` with `healthcontract` chaincode deployed:
   ```bash
   cd ~/fabric-samples/test-network
   ./network.sh up createChannel -c healthchannel -ca
   ./network.sh deployCCAAS -c healthchannel -ccn healthcontract -ccp ~/internship-blockchain-health/chaincode
   ```
4. **IPFS Daemon** running on port 5001:
   ```bash
   ipfs daemon
   ```
5. **Node.js Backend** running on port 3000:
   ```bash
   cd ~/internship-blockchain-health/app
   node server.js
   ```

## 2. Benchmark Environment
The Python benchmark driver runs inside the experiments virtual environment:
```bash
source ~/internship-blockchain-health/experiments/.venv/bin/activate
```

## 3. Modular Architecture for Future Research
The benchmark framework is designed for open scientific extension:
- New access control or cryptographic methods can be registered in `experiments/methods/` by implementing `AccessControlMethod`.
- Runners and graph generators automatically discover and benchmark all registered methods alongside the BGW and Baseline implementations.

## 4. Execution Workflow
```bash
# Pre-flight warm-up & health verification
python3 experiments/runners/run_warmup.py

# Latency benchmark (Figure 2)
python3 experiments/runners/run_latency.py

# Throughput benchmark (Figure 3)
python3 experiments/runners/run_throughput.py

# Communication overhead benchmark (Figure 4)
python3 experiments/runners/run_communication.py

# Computation overhead benchmark (Figure 5)
python3 experiments/runners/run_computation.py

# User scalability benchmark (Figure 6)
python3 experiments/runners/run_scalability.py

# Baseline vs BGW sharing comparison
python3 experiments/runners/run_encryption_eval.py

# Master benchmark run (orchestrates all)
python3 experiments/runners/run_all.py --smoke-test

# Process raw measurements into aggregated CSVs
python3 experiments/processing/process_results.py

# Generate final publication-quality figures
python3 experiments/graphs/figure2_latency.py
python3 experiments/graphs/figure3_throughput.py
python3 experiments/graphs/figure4_communication.py
python3 experiments/graphs/figure5_computation.py
python3 experiments/graphs/figure6_scalability.py
python3 experiments/graphs/figure_comparative_methods.py
```
