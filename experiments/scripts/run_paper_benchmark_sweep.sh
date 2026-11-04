#!/bin/bash
# ==============================================================================
# Complete Base Paper Benchmark Sweep (Figures 2, 3, 4, 5, 6)
# Reference: Notash, Jamali, Fotohi (Blockchain: Research and Applications, 2026)
# ==============================================================================
set -e

REPO_DIR="/home/krishna/internship-blockchain-health"
FABRIC_DIR="/home/krishna/fabric-samples/test-network"
CONFIGTX_FILE="$FABRIC_DIR/configtx/configtx.yaml"
PYTHON_BIN="$REPO_DIR/experiments/.venv/bin/python3"
NODE_BIN="/home/krishna/.nvm/versions/node/v18.19.0/bin/node"

export PATH="/home/krishna/.nvm/versions/node/v18.19.0/bin:$PATH"

echo "======================================================================"
echo "BASE PAPER COMPREHENSIVE BENCHMARK SWEEP (BLOCK SIZES: 5, 10, 15, 20)"
echo "======================================================================"

# ------------------------------------------------------------------------------
# STEP 0: Clean Start (Archive old data once at the very beginning)
# ------------------------------------------------------------------------------
echo -e "\n[Step 0] Cleaning environment for fresh execution..."
cd "$REPO_DIR/experiments"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p results/archive/sweep_backup_${TIMESTAMP}
mv results/raw/*.csv results/archive/sweep_backup_${TIMESTAMP}/ 2>/dev/null || true
mv results/metadata/*.json results/archive/sweep_backup_${TIMESTAMP}/ 2>/dev/null || true
rm -f results/processed/*.csv
rm -f results/figures/*.png results/figures/*.pdf
mkdir -p results/raw results/processed results/figures results/metadata

# Ensure IPFS is running
if ! pgrep -x "ipfs" > /dev/null; then
    echo "Starting IPFS daemon..."
    nohup ipfs daemon > /tmp/ipfs.log 2>&1 &
    sleep 4
fi

# Clean any existing stopped or stale CCAAS containers to avoid naming conflicts
docker rm -f $(docker ps -aq --filter "name=ccaas") 2>/dev/null || true
docker rm -f peer0org1_healthcontract_ccaas peer0org2_healthcontract_ccaas chaincode_health 2>/dev/null || true

# ------------------------------------------------------------------------------
# STEP 1: Loop across all 4 Block Sizes (5, 10, 15, 20)
# ------------------------------------------------------------------------------
BLOCK_SIZES=(5 10 15 20)
METHODS=("bgw_broadcast" "baseline_repeated_encryption")

for BS in "${BLOCK_SIZES[@]}"; do
    echo ""
    echo "######################################################################"
    echo ">>> CONFIGURING BLOCK SIZE: $BS (MaxMessageCount: $BS) <<<"
    echo "######################################################################"

    # 1. Update configtx.yaml
    sed -i "s/MaxMessageCount: [0-9]*/MaxMessageCount: $BS/" "$CONFIGTX_FILE"
    grep -n "MaxMessageCount:" "$CONFIGTX_FILE"

    # 2. Restart Fabric Network from scratch with guaranteed container cleanup
    cd "$FABRIC_DIR"
    docker rm -f $(docker ps -aq --filter "name=ccaas") 2>/dev/null || true
    docker rm -f peer0org1_healthcontract_ccaas peer0org2_healthcontract_ccaas chaincode_health 2>/dev/null || true
    ./network.sh down
    docker rm -f $(docker ps -aq --filter "name=ccaas") 2>/dev/null || true
    docker rm -f peer0org1_healthcontract_ccaas peer0org2_healthcontract_ccaas chaincode_health 2>/dev/null || true

    ./network.sh up createChannel -c healthchannel -ca
    ./network.sh deployCCAAS -c healthchannel -ccn healthcontract -ccp "$REPO_DIR/chaincode"

    # 3. Reset Wallet, Enroll Identities & Start Backend
    cd "$REPO_DIR/app"
    rm -f bgw_kgc_state.json records_registry.json
    rm -rf wallet/*
    $NODE_BIN enrollAdmin.js
    pkill -9 -f "node server.js" 2>/dev/null || true
    sleep 2
    nohup /home/krishna/internship-blockchain-health/app/start_backend.sh > /dev/null 2>&1 &
    sleep 4

    # Verify Backend is responsive
    curl -s http://127.0.0.1:3000/api/health
    echo ""

    # 4. Run benchmarks for each method on this Block Size
    cd "$REPO_DIR/experiments"
    for MTH in "${METHODS[@]}"; do
        echo "   --- Running benchmarks for Method: $MTH on Block Size: $BS ---"
        
        # Figure 2: Latency vs. Load (10, 25, 50 txs)
        $PYTHON_BIN runners/run_latency.py --workloads 10 25 50 --method "$MTH"
        
        # Figure 3: Throughput (Concurrency 2: Low Rate, Concurrency 5: High Rate)
        $PYTHON_BIN runners/run_throughput.py --concurrency 2 5 --method "$MTH"
        
        # Figure 4: Communication Overhead (Workload 5: Low Rate, Workload 10: High Rate)
        $PYTHON_BIN runners/run_communication.py --workloads 5 10 --method "$MTH"
        
        # Figure 5: Computation Overhead (Workload 5: Low Rate, Workload 10: High Rate)
        $PYTHON_BIN runners/run_computation.py --workloads 5 10 --method "$MTH"
    done
done

# ------------------------------------------------------------------------------
# STEP 2: Figure 6 Scalability Benchmark (User Scaling: 10 -> 100)
# ------------------------------------------------------------------------------
echo ""
echo "######################################################################"
echo ">>> RUNNING FIGURE 6: USER SCALABILITY (PROPOSED VS BASELINE) <<<"
echo "######################################################################"
cd "$REPO_DIR/experiments"
for MTH in "${METHODS[@]}"; do
    $PYTHON_BIN runners/run_scalability.py --scales 10 20 50 100 --method "$MTH"
done

# ------------------------------------------------------------------------------
# STEP 3: Core Cryptographic Sharing Evaluation (Section 6)
# ------------------------------------------------------------------------------
echo ""
echo "######################################################################"
echo ">>> RUNNING CRYPTOGRAPHIC SHARING EVALUATION (BGW VS BASELINE) <<<"
echo "######################################################################"
$PYTHON_BIN runners/run_encryption_eval.py --sizes-kb 50 250 --recipients 2 5 --repetitions 3

# ------------------------------------------------------------------------------
# STEP 4: Process All Raw Measurements & Render Final Publication Figures
# ------------------------------------------------------------------------------
echo ""
echo "######################################################################"
echo ">>> PROCESSING ALL RAW OBSERVATIONS & GENERATING FINAL FIGURES <<<"
echo "######################################################################"
$PYTHON_BIN processing/process_results.py

# Generate publication plots strictly conforming to Base Paper specification
$PYTHON_BIN graphs/figure2_latency.py
$PYTHON_BIN graphs/figure3_throughput.py
$PYTHON_BIN graphs/figure4_communication.py
$PYTHON_BIN graphs/figure5_computation.py
$PYTHON_BIN graphs/figure6_scalability.py
$PYTHON_BIN graphs/figure_comparative_methods.py
$PYTHON_BIN graphs/generate_bgw_vs_single_graphs.py --calibrate

echo ""
echo "======================================================================"
echo "🎉 COMPLETE PAPER REPLICATION RUN FINISHED SUCCESSFULLY!"
echo "All figures generated in: $REPO_DIR/experiments/results/figures/"
echo "======================================================================"
