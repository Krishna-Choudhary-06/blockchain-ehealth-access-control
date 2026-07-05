#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEST_NETWORK="${FABRIC_TEST_NETWORK:-$HOME/fabric-samples/test-network}"
CHANNEL_NAME="${CHANNEL_NAME:-mychannel}"
CC_NAME="${CC_NAME:-ehr-registration-v3}"
CC_VERSION="${CC_VERSION:-2.1}"
CC_SEQUENCE="${CC_SEQUENCE:-6}"

echo "Redeploying $CC_NAME on $CHANNEL_NAME"
echo "Repo: $REPO_ROOT"
echo "Fabric test network: $TEST_NETWORK"
echo "Version: $CC_VERSION"
echo "Sequence: $CC_SEQUENCE"

cd "$TEST_NETWORK"

./network.sh deployCC \
  -c "$CHANNEL_NAME" \
  -ccn "$CC_NAME" \
  -ccp "$REPO_ROOT/chaincode" \
  -ccl javascript \
  -ccv "$CC_VERSION" \
  -ccs "$CC_SEQUENCE"
