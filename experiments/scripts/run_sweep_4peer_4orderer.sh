#!/bin/bash
# ==============================================================================
# 4-Peer & 4-Orderer Benchmark Sweep Orchestrator
# Preserves the 2-Peer baseline (run_paper_benchmark_sweep.sh) completely untouched.
# Reference: Notash, Jamali, Fotohi (Blockchain: Research and Applications, 2026)
# ==============================================================================
set -e

REPO_DIR="/home/krishna/internship-blockchain-health"
FABRIC_DIR="/home/krishna/fabric-samples/test-network"
CONFIGTX_FILE="$FABRIC_DIR/configtx/configtx.yaml"
OUT_DIR="$REPO_DIR/experiments/results_4p4o"
PYTHON_BIN="$REPO_DIR/experiments/.venv/bin/python3"
NODE_BIN="/home/krishna/.nvm/versions/node/v18.19.0/bin/node"

export PATH="$FABRIC_DIR/../bin:/home/krishna/fabric-samples/bin:/home/krishna/.nvm/versions/node/v18.19.0/bin:$PATH"
export FABRIC_CFG_PATH="$FABRIC_DIR/configtx"

# Ensure dedicated Python virtual environment is healthy
VENV_DIR="$REPO_DIR/experiments/.venv"
if [ ! -f "$VENV_DIR/bin/python3" ]; then
    echo "[Setup] Initializing dedicated Python virtual environment..."
    rm -rf "$VENV_DIR"
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --upgrade pip --quiet
    "$VENV_DIR/bin/pip" install -r "$REPO_DIR/experiments/requirements.txt" --quiet
fi
PYTHON_BIN="$VENV_DIR/bin/python3"

echo "======================================================================"
echo "4-PEER & 4-ORDERER BENCHMARK SWEEP (BLOCK SIZES: 5, 10, 15, 20)"
echo "Raft Consensus Cluster: 4 Orderers (Quorum = 3)"
echo "Network Topology: 4 Endorsing Peers (2 Org1, 2 Org2)"
echo "Output Directory: $OUT_DIR"
echo "======================================================================"

# ------------------------------------------------------------------------------
# STEP 0: Clean Start for 4P-4O Results
# ------------------------------------------------------------------------------
echo -e "\n[Step 0] Initializing isolated 4P-4O results directory..."
mkdir -p "$OUT_DIR/raw" "$OUT_DIR/processed" "$OUT_DIR/figures" "$OUT_DIR/metadata"

# Ensure IPFS is running
if ! pgrep -x "ipfs" > /dev/null; then
    echo "Starting IPFS daemon..."
    nohup ipfs daemon > /tmp/ipfs.log 2>&1 &
    sleep 4
fi

# Clean existing Fabric containers and volumes
cd "$FABRIC_DIR"
docker rm -f $(docker ps -aq --filter "name=ccaas") 2>/dev/null || true
docker rm -f peer0org1_healthcontract_ccaas peer1org1_healthcontract_ccaas \
             peer0org2_healthcontract_ccaas peer1org2_healthcontract_ccaas 2>/dev/null || true
docker compose -f compose/compose-ca.yaml -f compose/compose-4p-4o.yaml down -v --remove-orphans 2>/dev/null || true
./network.sh down 2>/dev/null || true
docker volume rm -f $(docker volume ls -q --filter "name=compose_") 2>/dev/null || true
docker volume rm -f $(docker volume ls -q --filter "name=peer") 2>/dev/null || true
docker volume rm -f $(docker volume ls -q --filter "name=orderer") 2>/dev/null || true
rm -rf channel-artifacts/*.block

# ------------------------------------------------------------------------------
# STEP 1: Loop across all 4 Block Sizes (5, 10, 15, 20)
# ------------------------------------------------------------------------------
BLOCK_SIZES=(5 10 15 20)
METHODS=("bgw_broadcast" "baseline_repeated_encryption")

for BS in "${BLOCK_SIZES[@]}"; do
    echo ""
    echo "######################################################################"
    echo ">>> CONFIGURING BLOCK SIZE: $BS (MaxMessageCount: $BS) [4P-4O] <<<"
    echo "######################################################################"

    # 1. Update configtx.yaml
    sed -i "s/MaxMessageCount: [0-9]*/MaxMessageCount: $BS/" "$CONFIGTX_FILE"
    sed -i "s/BatchTimeout: .*/BatchTimeout: 500ms/" "$CONFIGTX_FILE"
    grep -n "MaxMessageCount:" "$CONFIGTX_FILE"
    grep -n "BatchTimeout:" "$CONFIGTX_FILE"

    # 2. Restart Fabric Network with 4 Peers and 4 Orderers
    cd "$FABRIC_DIR"
    docker rm -f $(docker ps -aq --filter "name=ccaas") 2>/dev/null || true
    docker rm -f peer0org1_healthcontract_ccaas peer1org1_healthcontract_ccaas \
                 peer0org2_healthcontract_ccaas peer1org2_healthcontract_ccaas 2>/dev/null || true
    docker compose -f compose/compose-ca.yaml -f compose/compose-4p-4o.yaml down -v --remove-orphans 2>/dev/null || true
    ./network.sh down 2>/dev/null || true
    docker volume rm -f $(docker volume ls -q --filter "name=compose_") 2>/dev/null || true
    docker volume rm -f $(docker volume ls -q --filter "name=peer") 2>/dev/null || true
    docker volume rm -f $(docker volume ls -q --filter "name=orderer") 2>/dev/null || true
    rm -rf channel-artifacts/*.block

    # Generate certificates for 4 orderers & 4 peers
    cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-org1-4p.yaml --output="organizations"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-org2-4p.yaml --output="organizations"
    ./organizations/ccp-generate.sh

    # Launch CAs, 4 orderers and 4 peers
    docker compose -f compose/compose-ca.yaml -f compose/compose-4p-4o.yaml up -d
    sleep 5

    # Generate channel genesis block for 4-node Raft and create channel
    export FABRIC_CFG_PATH=${PWD}/configtx
    configtxgen -profile ChannelUsingRaft4Nodes -outputBlock ./channel-artifacts/healthchannel.block -channelID healthchannel
    
    # Join all 4 orderers to the Raft channel
    export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
    . scripts/orderer.sh healthchannel
    . scripts/orderer2.sh healthchannel
    . scripts/orderer3.sh healthchannel
    . scripts/orderer4.sh healthchannel
    sleep 3

    # Join peers to channel
    export FABRIC_CFG_PATH=${PWD}/../config
    export CORE_PEER_TLS_ENABLED=true
    
    # Wait for peer containers to be ready
    echo "Waiting for peer0.org1 to listen on port 7051..."
    for i in {1..15}; do
        if (echo > /dev/tcp/localhost/7051) 2>/dev/null; then
            echo "peer0.org1 is up and ready!"
            break
        fi
        sleep 1
    done
    
    joinPeerSafe() {
        local res=0
        peer channel join -b ./channel-artifacts/healthchannel.block >&log.txt || res=$?
        if [ $res -ne 0 ]; then
            if grep -q "already exists with state" log.txt; then
                echo "Peer already joined to healthchannel, continuing."
            else
                cat log.txt
                return $res
            fi
        fi
        cat log.txt
    }

    unset CORE_PEER_TLS_SERVERHOSTOVERRIDE
    # Org1 Peers
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    joinPeerSafe
    export CORE_PEER_ADDRESS=localhost:8051
    joinPeerSafe

    # Org2 Peers
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
    joinPeerSafe
    export CORE_PEER_ADDRESS=localhost:10051
    joinPeerSafe
    unset CORE_PEER_TLS_SERVERHOSTOVERRIDE

    # Deploy CCAAS Chaincode on all 4 Peers
    ./scripts/deployCCAAS_4p.sh healthchannel healthcontract "$REPO_DIR/chaincode"

    # 3. Reset Wallet, Enroll Identities & Start Backend
    cd "$REPO_DIR/app"
    rm -f bgw_kgc_state.json records_registry.json
    rm -rf wallet/*
    $NODE_BIN enrollAdmin.js
    pkill -9 -f "node server.js" 2>/dev/null || true
    sleep 2
    nohup $NODE_BIN server.js > /tmp/backend_api.log 2>&1 &

    # Verify Backend is responsive with polling
    echo "Waiting for API backend to start on port 3000..."
    BACKEND_ONLINE=false
    for i in {1..30}; do
        if curl -s http://127.0.0.1:3000/api/health > /dev/null 2>&1; then
            echo "✅ API Backend is online and responsive!"
            curl -s http://127.0.0.1:3000/api/health
            echo ""
            BACKEND_ONLINE=true
            break
        fi
        sleep 1
    done

    if [ "$BACKEND_ONLINE" = false ]; then
        echo "❌ ERROR: Backend API failed to become healthy on port 3000 within 30 seconds."
        echo "=== /tmp/backend_api.log ==="
        cat /tmp/backend_api.log 2>/dev/null || true
        exit 1
    fi

    # 4. Run benchmarks for each method on this Block Size (saved directly to isolated 4P-4O directory)
    cd "$REPO_DIR/experiments"
    export RAW_DIR="$OUT_DIR/raw"
    export METADATA_DIR="$OUT_DIR/metadata"
    for MTH in "${METHODS[@]}"; do
        echo "   --- [4P-4O] Running benchmarks for Method: $MTH on Block Size: $BS ---"
        
        $PYTHON_BIN runners/run_latency.py --workloads 10 25 50 --method "$MTH"
        $PYTHON_BIN runners/run_throughput.py --concurrency 1 2 3 5 8 10 --method "$MTH"
        $PYTHON_BIN runners/run_communication.py --workloads 5 10 15 20 25 30 --method "$MTH"
        $PYTHON_BIN runners/run_computation.py --workloads 5 10 15 20 25 30 --method "$MTH"
    done
done

# Move newly generated raw files to isolated 4P-4O directory
mv "$REPO_DIR/experiments/results/raw/"*.csv "$OUT_DIR/raw/" 2>/dev/null || true

# ------------------------------------------------------------------------------
# STEP 2: Scalability & Cryptographic Evaluation for 4P-4O
# ------------------------------------------------------------------------------
echo ""
echo "######################################################################"
echo ">>> [4P-4O] RUNNING USER SCALABILITY & CRYPTO EVALUATION <<<"
echo "######################################################################"
cd "$REPO_DIR/experiments"
export RAW_DIR="$OUT_DIR/raw"
for MTH in "${METHODS[@]}"; do
    $PYTHON_BIN runners/run_scalability.py --scales 10 20 50 100 --method "$MTH"
done
$PYTHON_BIN runners/run_encryption_eval.py --sizes-kb 50 250 --recipients 2 5 --repetitions 3

# Move scalability raw files to 4P-4O directory
mv "$REPO_DIR/experiments/results/raw/"*.csv "$OUT_DIR/raw/" 2>/dev/null || true

# ------------------------------------------------------------------------------
# STEP 3: Process 4P-4O Results & Render Figures
# ------------------------------------------------------------------------------
echo ""
echo "######################################################################"
echo ">>> [4P-4O] PROCESSING DATA & RENDERING FIGURES <<<"
echo "######################################################################"
RAW_DIR="$OUT_DIR/raw" PROCESSED_DIR="$OUT_DIR/processed" $PYTHON_BIN processing/process_results.py

# Render Figures for 4P-4O isolated dataset
PROCESSED_DIR="$OUT_DIR/processed" FIGURES_DIR="$OUT_DIR/figures" $PYTHON_BIN graphs/figure2_latency.py
PROCESSED_DIR="$OUT_DIR/processed" FIGURES_DIR="$OUT_DIR/figures" $PYTHON_BIN graphs/figure3_throughput.py
PROCESSED_DIR="$OUT_DIR/processed" FIGURES_DIR="$OUT_DIR/figures" $PYTHON_BIN graphs/figure4_communication.py
PROCESSED_DIR="$OUT_DIR/processed" FIGURES_DIR="$OUT_DIR/figures" $PYTHON_BIN graphs/figure5_computation.py
PROCESSED_DIR="$OUT_DIR/processed" FIGURES_DIR="$OUT_DIR/figures" $PYTHON_BIN graphs/figure6_scalability.py

# Generate comparison plot: 2 Peers vs 4 Peers
$PYTHON_BIN graphs/compare_2p_vs_4p.py

echo ""
echo "======================================================================"
echo "🎉 4-PEER & 4-ORDERER BENCHMARK SWEEP FINISHED SUCCESSFULLY!"
echo "Isolated results saved to: $OUT_DIR"
echo "Comparative graph generated: $OUT_DIR/figures/comparative_topology_2p_vs_4p.png"
echo "======================================================================"
