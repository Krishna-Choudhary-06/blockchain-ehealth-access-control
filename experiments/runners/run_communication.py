"""
Communication Overhead Benchmark Runner (Figure 4 Replication)
Measures application and network communication bytes across low and high transaction loads.

Audited Enhancement:
  - Invokes MethodRegistry.initial_share() directly so communication payloads accurately reflect
    the selected scheme's wire footprints.
"""

import os
import sys
import time
import uuid
import yaml
import pandas as pd
from datetime import datetime
from typing import List

sys.path.append("/home/krishna/internship-blockchain-health")
from experiments.clients.backend_client import BackendClient
from experiments.collectors.fabric_metrics import get_configured_block_size
from experiments.collectors.system_metrics import collect_system_metadata, save_metadata
from experiments.methods.registry import MethodRegistry

def run_communication_benchmark(workloads: List[int] = None, method_name: str = "bgw_broadcast") -> str:
    print("\n" + "=" * 60)
    print(f"STARTING COMMUNICATION OVERHEAD BENCHMARK (Figure 4)")
    print("=" * 60)

    block_size = get_configured_block_size()
    if workloads is None:
        workloads = [5, 10]

    run_id = f"comm_blk{block_size}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    print(f"Run ID: {run_id} | Block Size: {block_size} | Method: {method_name}")

    meta = collect_system_metadata(run_id=run_id, block_size=block_size)
    save_metadata(meta)

    client = BackendClient()
    method = MethodRegistry.get(method_name)
    method.setup()

    raw_records = []

    for wl in workloads:
        print(f"\n--- Measuring Communication for Workload: {wl} txs ---")
        for i in range(wl):
            user_id = f"user_comm_{i % 5}"
            data_id = f"rec_comm_{uuid.uuid4().hex[:8]}"
            payload = f"Communication payload byte test {i} for {user_id}".encode("utf-8")
            
            client.register_user(user_id=user_id, role="Doctor")
            client.assign_level(user_id=user_id, level="L0")

            t0 = time.perf_counter()
            resp = method.initial_share(
                patient_id=user_id,
                file_bytes=payload,
                filename=f"comm_doc_{i}.txt",
                recipient_ids=[user_id],
                level="L0"
            )
            lat_ms = (time.perf_counter() - t0) * 1000.0

            req_b = resp.get("request_bytes", len(payload))
            resp_b = resp.get("response_bytes", 0)
            total_comm_bytes = req_b + resp_b

            raw_records.append({
                "run_id": run_id,
                "experiment": "figure4_communication",
                "block_size": block_size,
                "method": method_name,
                "workload": wl,
                "transaction_id": data_id,
                "request_bytes": req_b,
                "response_bytes": resp_b,
                "total_communication_bytes": total_comm_bytes,
                "payload_bytes": len(payload),
                "latency_ms": lat_ms,
                "success": resp.get("success", False),
                "error": resp.get("error")
            })

    df = pd.DataFrame(raw_records)
    out_dir = "/home/krishna/internship-blockchain-health/experiments/results/raw"
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"raw_{run_id}.csv")
    df.to_csv(csv_path, index=False)

    print(f"\n✅ Communication benchmark complete. Saved to:\n   {csv_path}\n")
    return csv_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run Communication Benchmark (Figure 4)")
    parser.add_argument("--workloads", nargs="+", type=int, default=[5, 10], help="Workloads")
    parser.add_argument("--method", type=str, default="bgw_broadcast", help="Method name")
    args = parser.parse_args()

    run_communication_benchmark(workloads=args.workloads, method_name=args.method)
