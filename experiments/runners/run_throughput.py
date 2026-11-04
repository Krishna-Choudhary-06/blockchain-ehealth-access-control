"""
Throughput Benchmark Runner (Figure 3 Replication)
Evaluates valid committed transactions per second across low and high transaction arrival rates.

Audited Enhancement:
  - Invokes MethodRegistry.initial_share() directly so both BGW and Baseline encryption execution paths are tested.
  - Aligns default concurrency levels ([2, 5]) with the Low-Rate and High-Rate panel definitions in Figure 3.
"""

import os
import sys
import time
import uuid
import yaml
import pandas as pd
import psutil
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

sys.path.append("/home/krishna/internship-blockchain-health")
from experiments.clients.backend_client import BackendClient
from experiments.collectors.fabric_metrics import get_configured_block_size
from experiments.collectors.system_metrics import collect_system_metadata, save_metadata
from experiments.methods.registry import MethodRegistry

CONFIG_PATH = "/home/krishna/internship-blockchain-health/experiments/config/experiment.yaml"

def send_single_tx(method, client: BackendClient, index: int) -> Dict[str, Any]:
    tx_id = f"tx_tps_{uuid.uuid4().hex[:10]}"
    user_id = f"user_tps_{index % 10}"
    payload = f"Throughput Test Payload {index} for {user_id}".encode("utf-8")
    t_submit = datetime.utcnow().isoformat() + "Z"
    t0 = time.perf_counter()
    
    resp = method.initial_share(
        patient_id=user_id,
        file_bytes=payload,
        filename=f"tps_doc_{index}.txt",
        recipient_ids=[user_id],
        level="L0"
    )
    t_commit = datetime.utcnow().isoformat() + "Z"
    lat_ms = (time.perf_counter() - t0) * 1000.0

    return {
        "transaction_id": tx_id,
        "submit_timestamp": t_submit,
        "commit_timestamp": t_commit,
        "latency_ms": lat_ms,
        "backend_latency_ms": resp.get("backend_latency_ms", lat_ms),
        "success": resp.get("success", False),
        "status_code": 200 if resp.get("success") else 500,
        "request_bytes": resp.get("request_bytes", len(payload)),
        "response_bytes": resp.get("response_bytes", 0),
        "error": resp.get("error")
    }

def run_throughput_benchmark(concurrency_levels: List[int] = None, txs_per_level: int = 5, method_name: str = "bgw_broadcast") -> str:
    print("\n" + "=" * 60)
    print(f"STARTING THROUGHPUT BENCHMARK (Figure 3)")
    print("=" * 60)

    block_size = get_configured_block_size()
    if concurrency_levels is None:
        concurrency_levels = [2, 5]

    run_id = f"throughput_blk{block_size}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    print(f"Run ID: {run_id} | Block Size: {block_size} | Concurrencies: {concurrency_levels} | Method: {method_name}")

    meta = collect_system_metadata(run_id=run_id, block_size=block_size)
    save_metadata(meta)

    client = BackendClient()
    method = MethodRegistry.get(method_name)
    method.setup()

    # Pre-register test users
    for i in range(10):
        client.register_user(f"user_tps_{i}", "Doctor")
        client.assign_level(f"user_tps_{i}", "L0")

    raw_records = []

    for concurrency in concurrency_levels:
        total_txs = txs_per_level * concurrency
        print(f"\n--- Testing Concurrency: {concurrency} workers ({total_txs} total txs) ---")
        
        t_batch_start = time.perf_counter()
        results = []
        
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(send_single_tx, method, client, i) for i in range(total_txs)]
            for fut in as_completed(futures):
                results.append(fut.result())

        duration_sec = time.perf_counter() - t_batch_start
        committed = sum(1 for r in results if r["success"])
        committed_tps = round(committed / max(0.001, duration_sec), 2)
        print(f"   Batch finished in {duration_sec:.2f}s | Committed: {committed}/{total_txs} | Throughput: {committed_tps} TPS")

        for r in results:
            r.update({
                "run_id": run_id,
                "experiment": "figure3_throughput",
                "block_size": block_size,
                "method": method_name,
                "concurrency": concurrency,
                "batch_duration_sec": duration_sec,
                "committed_tps": committed_tps,
                "cpu_percent": psutil.cpu_percent(interval=None),
                "memory_mb": round(psutil.Process().memory_info().rss / (1024 * 1024), 2)
            })
            raw_records.append(r)

    df = pd.DataFrame(raw_records)
    out_dir = "/home/krishna/internship-blockchain-health/experiments/results/raw"
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"raw_{run_id}.csv")
    df.to_csv(csv_path, index=False)

    print(f"\n✅ Throughput benchmark complete. Saved {len(raw_records)} records to:\n   {csv_path}\n")
    return csv_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run Throughput Benchmark (Figure 3)")
    parser.add_argument("--concurrency", nargs="+", type=int, default=[2, 5], help="Concurrency levels")
    parser.add_argument("--txs-per-level", type=int, default=5, help="Transactions per level")
    parser.add_argument("--method", type=str, default="bgw_broadcast", help="Access control method")
    args = parser.parse_args()

    run_throughput_benchmark(concurrency_levels=args.concurrency, txs_per_level=args.txs_per_level, method_name=args.method)
