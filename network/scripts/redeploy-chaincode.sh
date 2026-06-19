#!/bin/bash
# =============================================================
# redeploy-chaincode.sh
# Redeploys healthcontract chaincode to fix endorsement mismatch
# Run this from: ~/internship-blockchain-health/network/scripts/
# =============================================================
set -e

CHAINCODE_DIR="$HOME/internship-blockchain-health/chaincode"
CHANNEL_NAME="healthchannel"
CC_NAME="healthcontract"
CC_VERSION="2.0"
CC_SEQUENCE=2

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}==== Redeploying chaincode to fix endorsement mismatch ====${NC}"

# ---------------------------------------------------------------
# Step 1: Restart the chaincode container with new code
# ---------------------------------------------------------------
echo -e "${GREEN}Step 1: Restarting chaincode_health container...${NC}"
docker restart chaincode_health
sleep 3
echo "Chaincode container restarted."

# ---------------------------------------------------------------
# Step 2: Verify the container is running
# ---------------------------------------------------------------
echo -e "${GREEN}Step 2: Verifying container status...${NC}"
docker ps --filter "name=chaincode_health" --format "{{.Names}}\t{{.Status}}"

# ---------------------------------------------------------------
# Step 3: Check chaincode logs for errors
# ---------------------------------------------------------------
echo -e "${GREEN}Step 3: Checking chaincode logs (last 20 lines)...${NC}"
docker logs chaincode_health --tail 20 2>&1

echo ""
echo -e "${GREEN}==== Done! Now test with: ====${NC}"
echo "curl -X POST http://localhost:3000/api/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"userId\":\"doc003\",\"publicKey\":\"pubkey123\",\"role\":\"doctor\"}'"
