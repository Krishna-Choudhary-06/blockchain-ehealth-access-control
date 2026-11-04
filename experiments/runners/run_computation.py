"""
Computation Overhead Benchmark Runner (Figure 5 Replication)
Measures execution time and CPU resource consumption during smart contract execution and encryption.

Audited Enhancement:
  - Invokes MethodRegistry.initial_share() directly so computation overhead reflects true cryptographic
    and smart contract processing paths.
"""

import os
import sys
import time
import uuid
import yaml
import pandas as pd
import psutil
from datetime import datetime
from typing import List

sys.path.append("/home/krishna/internship-blockchain-health")
from experiments.clients.backend_client import BackendClient
from experiments.collectors.fabric_metrics import get_configured_block_size
from experiments.collectors.system_metrics import collect_system_metadata, save_metadata
from experiments.methods.registry import MethodRegistry

def run_computation_benchmark(workloads: List[int] = None, method_name: str = "bgw_broadcast") -> str:
    print("\n" + "=" * 60)
    print(f"STARTING COMPUTATION OVERHEAD BENCHMARK (Figure 5)")
    print("=" * 60)

    block_size = get_configured_block_size()
    if workloads is None:
        workloads = [5, 10]

    run_id = f"comp_blk{block_size}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    print(f"Run ID: {run_id} | Block Size: {block_size} | Method: {method_name}")

    meta = collect_system_metadata(run_id=run_id, block_size=block_size)
    save_metadata(meta)

    client = BackendClient()
    method = MethodRegistry.get(method_name)
    method.setup()

    proc = psutil.Process()
    raw_records = []

    for wl in workloads:
        print(f"\n--- Measuring Computation for Workload: {wl} txs ---")
        for i in range(wl):
            user_id = f"user_comp_{i % 5}"
            data_id = f"rec_comp_{uuid.uuid4().hex[:8]}"
            payload = f"Computation test payload {i} for {user_id}".encode("utf-8")

            client.register_user(user_id=user_id, role="Doctor")
            client.assign_level(user_id=user_id, level="L0")

            # Sample CPU times before
            cpu_before = proc.cpu_times()
            psutil.cpu_percent(interval=None) # reset window
            t0 = time.perf_counter()

            resp = method.initial_share(
                patient_id=user_id,
                file_bytes=payload,
                filename=f"comp_doc_{i}.txt",
                recipient_ids=[user_id],
                level="L0"
            )

            exec_time_ms = (time.perf_counter() - t0) * 1000.0
            cpu_after = proc.cpu_times()
            cpu_user_ms = (cpu_after.user - cpu_before.user) * 1000.0
            cpu_system_ms = (cpu_after.system - cpu_before.system) * 1000.0
            cpu_pct = psutil.cpu_percent(interval=None)

            raw_records.append({
                "run_id": run_id,
                "experiment": "figure5_computation",
                "block_size": block_size,
                "method": method_name,
                "workload": wl,
                "transaction_id": data_id,
                "execution_time_ms": exec_time_ms,
                "cpu_user_ms": cpu_user_ms,
                "cpu_system_ms": cpu_system_ms,
                "cpu_percent": cpu_pct,
                "memory_rss_mb": round(proc.memory_info().rss / (1024 * 1024), 2),
                "success": resp.get("success", False),
                "error": resp.get("error")
            })

    df = pd.DataFrame(raw_records)
    out_dir = "/home/krishna/internship-blockchain-health/experiments/results/raw"
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"raw_{run_id}.csv")
    df.to_csv(csv_path, index=False)

    print(f"\n✅ Computation benchmark complete. Saved to:\n   {csv_path}\n")
    return csv_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run Computation Benchmark (Figure 5)")
    parser.add_argument("--workloads", nargs="+", type=int, default=[5, 10], help="Workloads")
    parser.add_argument("--method", type=str, default="bgw_broadcast", help="Method name")
    args = parser.parse_args()

    run_computation_benchmark(workloads=args.workloads, method_name=args.method)
