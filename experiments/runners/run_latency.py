"""
Latency Benchmark Runner (Figure 2 Replication)
Measures transaction latency across configured transaction workloads and block sizes.
Supports both sequential (concurrency=1) and concurrent batching (concurrency>1).

Audited Enhancement:
  - Explicitly executes the selected access control method via MethodRegistry.initial_share(),
    ensuring method-specific cryptographic operations (BGW pairings vs Baseline AES/RSA) are genuinely evaluated.
"""

import os
import sys
import time
import uuid
import yaml
import pandas as pd
import psutil
from datetime import datetime
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append("/home/krishna/internship-blockchain-health")
from experiments.clients.backend_client import BackendClient
from experiments.collectors.fabric_metrics import get_configured_block_size
from experiments.collectors.system_metrics import collect_system_metadata, save_metadata
from experiments.methods.registry import MethodRegistry

CONFIG_PATH = "/home/krishna/internship-blockchain-health/experiments/config/experiment.yaml"

def send_single_latency_tx(method, client: BackendClient, user_id: str, index: int, block_size: int, 
                           run_id: str, method_name: str, wl: int, rep: int) -> Dict[str, Any]:
    tx_id = f"tx_lat_{uuid.uuid4().hex[:10]}"
    payload = f"Latency Medical Record Payload {index} for {user_id}".encode("utf-8")
    
    t_submit = datetime.utcnow().isoformat() + "Z"
    t0 = time.perf_counter()
    
    # Explicitly invoke selected access control method lifecycle!
    resp = method.initial_share(
        patient_id=user_id,
        file_bytes=payload,
        filename=f"lat_doc_{index}.txt",
        recipient_ids=[user_id],
        level="L0"
    )
    t_commit = datetime.utcnow().isoformat() + "Z"
    lat_ms = (time.perf_counter() - t0) * 1000.0

    return {
        "run_id": run_id,
        "experiment": "figure2_latency",
        "block_size": block_size,
        "method": method_name,
        "workload": wl,
        "repetition": rep,
        "transaction_id": tx_id,
        "submit_timestamp": t_submit,
        "commit_timestamp": t_commit,
        "latency_ms": lat_ms,
        "backend_latency_ms": resp.get("backend_latency_ms", lat_ms),
        "success": resp.get("success", False),
        "status_code": 200 if resp.get("success") else 500,
        "request_bytes": resp.get("request_bytes", len(payload)),
        "response_bytes": resp.get("response_bytes", 0),
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_mb": round(psutil.Process().memory_info().rss / (1024 * 1024), 2),
        "error": resp.get("error")
    }

def run_latency_benchmark(workloads: List[int] = None, repetitions: int = 1, 
                           concurrency: int = 1, method_name: str = "bgw_broadcast") -> str:
    print("\n" + "=" * 60)
    print(f"STARTING LATENCY BENCHMARK (Figure 2)")
    print("=" * 60)

    # 1. Load config
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            cfg = yaml.safe_load(f)
    else:
        cfg = {}

    block_size = get_configured_block_size()
    if workloads is None:
        workloads = cfg.get("workload", {}).get("transaction_rates", {}).get("target_rates", [10, 25, 50])

    run_id = f"latency_blk{block_size}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    mode_str = f"Concurrent (Workers: {concurrency})" if concurrency > 1 else "Sequential"
    print(f"Run ID: {run_id} | Block Size: {block_size} | Mode: {mode_str} | Method: {method_name}")

    # 2. Save metadata
    meta = collect_system_metadata(run_id=run_id, block_size=block_size)
    save_metadata(meta)

    client = BackendClient()
    method = MethodRegistry.get(method_name)
    method.setup()

    # Pre-register test users
    for i in range(10):
        client.register_user(f"user_lat_{i}", "Doctor")
        client.assign_level(f"user_lat_{i}", "L0")

    raw_records = []

    # 3. Execute across workloads
    for wl in workloads:
        print(f"\n--- Evaluating Target Workload: {wl} transactions ---")
        for rep in range(repetitions):
            print(f"   [Repetition {rep+1}/{repetitions}] Executing {wl} transactions ({mode_str})...")
            
            if concurrency > 1:
                with ThreadPoolExecutor(max_workers=concurrency) as executor:
                    futures = [
                        executor.submit(send_single_latency_tx, method, client, f"user_lat_{i % 10}", i, 
                                        block_size, run_id, method_name, wl, rep + 1)
                        for i in range(wl)
                    ]
                    for fut in as_completed(futures):
                        raw_records.append(fut.result())
            else:
                for i in range(wl):
                    rec = send_single_latency_tx(method, client, f"user_lat_{i % 10}", i, 
                                                 block_size, run_id, method_name, wl, rep + 1)
                    raw_records.append(rec)

    # 4. Save raw dataset
    df = pd.DataFrame(raw_records)
    out_dir = "/home/krishna/internship-blockchain-health/experiments/results/raw"
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"raw_{run_id}.csv")
    df.to_csv(csv_path, index=False)
    
    print(f"\n✅ Latency benchmark complete. Saved {len(raw_records)} raw transaction records to:\n   {csv_path}\n")
    return csv_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run Latency Benchmark (Figure 2)")
    parser.add_argument("--workloads", nargs="+", type=int, default=[5, 10], help="Workload levels")
    parser.add_argument("--repetitions", type=int, default=1, help="Repetition count")
    parser.add_argument("--concurrency", type=int, default=1, help="Concurrency workers")
    parser.add_argument("--method", type=str, default="bgw_broadcast", help="Access control method")
    args = parser.parse_args()

    run_latency_benchmark(workloads=args.workloads, repetitions=args.repetitions, 
                          concurrency=args.concurrency, method_name=args.method)
