"""
Pre-flight Warmup & Environment Verification
Verifies all dependencies (Fabric, IPFS, Backend), executes warm-up transactions, and discards cold-cache timings.

Audited Enhancement:
  - Fails fast (sys.exit(1)) if Fabric peer/orderer containers are missing, preventing polluted runs against broken infrastructure.
"""

import sys
import time
import os
sys.path.append("/home/krishna/internship-blockchain-health")

from experiments.clients.backend_client import BackendClient
from experiments.collectors.fabric_metrics import verify_fabric_health, get_configured_block_size
from experiments.collectors.ipfs_metrics import IPFSMetricsCollector

def run_warmup(warmup_count: int = 5):
    print("=" * 60)
    print("PRE-FLIGHT VERIFICATION & WARM-UP PHASE")
    print("=" * 60)

    # 1. Check Fabric (Fail-fast if unhealthy)
    print("[1/4] Verifying Hyperledger Fabric...")
    fab_health = verify_fabric_health()
    if not fab_health["healthy"]:
        print(f"❌ Fabric verification failed: Missing critical containers {fab_health['missing_critical']}")
        sys.exit(1)
    else:
        print(f"✅ Fabric online ({fab_health['container_count']} active containers)")
    block_size = get_configured_block_size()
    print(f"   Configured Block Size (MaxMessageCount): {block_size}")

    # 2. Check IPFS
    print("[2/4] Verifying IPFS Daemon...")
    ipfs = IPFSMetricsCollector()
    ipfs_health = ipfs.check_health()
    if not ipfs_health["available"]:
        print(f"❌ IPFS daemon is NOT available on port 5001: {ipfs_health.get('error')}")
        sys.exit(1)
    print(f"✅ IPFS online (Version: {ipfs_health['version']})")

    # 3. Check Backend
    print("[3/4] Verifying Node.js Backend API...")
    client = BackendClient()
    health_resp = client.health()
    if not health_resp["success"]:
        print(f"❌ Backend API is NOT running on http://127.0.0.1:3000: {health_resp.get('error')}")
        sys.exit(1)
    print(f"✅ Backend API online (Latency: {health_resp['latency_ms']:.2f} ms)")

    # 4. Execute Warm-up requests
    print(f"[4/4] Executing {warmup_count} warmup transactions (measurements discarded)...")
    for i in range(warmup_count):
        user_id = f"warmup_u{i}"
        client.register_user(user_id=user_id, role="Doctor")
        client.assign_level(user_id=user_id, level="L0")
        sample_bytes = f"Warmup health payload {i}".encode("utf-8")
        client.upload_file(
            file_bytes=sample_bytes,
            filename=f"warmup_{i}.txt",
            patient_id=user_id,
            data_id=f"warmup_rec_{i}",
            level="L0",
            authorized_users=[user_id]
        )
        print(f"   • Warmup transaction {i+1}/{warmup_count} completed")

    print("\n✅ PRE-FLIGHT VERIFICATION & WARM-UP COMPLETE. Ready for experimental benchmarks.\n")

if __name__ == "__main__":
    run_warmup()
