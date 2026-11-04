"""
User Scalability Benchmark Runner (Figure 6 Replication)
Evaluates system scaling across user client counts from 10 to 100:
  Figure 6a: Latency vs. Number of Users
  Figure 6b: Throughput vs. Number of Users
  Figure 6c: Communication Overhead vs. Number of Users
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

ROLES = ["Doctor", "Nurse", "Staff", "Patient"]
LEVELS = ["L0", "L1", "L2", "L3"]

def run_scalability_benchmark(user_scales: List[int] = None, method_name: str = "bgw_broadcast") -> str:
    print("\n" + "=" * 60)
    print(f"STARTING SCALABILITY BENCHMARK (Figure 6)")
    print("=" * 60)

    block_size = get_configured_block_size()
    if user_scales is None:
        user_scales = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    run_id = f"scale_blk{block_size}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    print(f"Run ID: {run_id} | Block Size: {block_size} | User Scales: {user_scales}")

    meta = collect_system_metadata(run_id=run_id, block_size=block_size)
    save_metadata(meta)

    client = BackendClient()
    method = MethodRegistry.get(method_name)
    method.setup()

    raw_records = []

    for num_users in user_scales:
        print(f"\n--- Scaling to {num_users} Users ---")
        
        t_batch_start = time.perf_counter()
        latencies = []
        comm_bytes = []
        committed_count = 0
        user_records = []

        for u in range(num_users):
            user_id = f"scale_u{u}_{num_users}"
            role = ROLES[u % len(ROLES)]
            level = LEVELS[u % len(LEVELS)]

            t0 = time.perf_counter()
            reg_resp = client.register_user(user_id=user_id, role=role)
            client.assign_level(user_id=user_id, level=level)
            
            # File upload
            sample_payload = f"Scalability record payload for user {user_id}".encode("utf-8")
            data_id = f"rec_scale_{num_users}_{u}"
            up_resp = method.initial_share(
                patient_id=user_id,
                file_bytes=sample_payload,
                filename=f"scale_{u}.txt",
                recipient_ids=[user_id],
                level=level
            )
            lat_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(lat_ms)

            tx_bytes = (reg_resp.get("request_bytes", 0) + reg_resp.get("response_bytes", 0) +
                        up_resp.get("request_bytes", 0) + up_resp.get("response_bytes", 0))
            comm_bytes.append(tx_bytes)

            success = reg_resp.get("success", False) and up_resp.get("success", False)
            if success:
                committed_count += 1

            user_records.append({
                "run_id": run_id,
                "experiment": "figure6_scalability",
                "block_size": block_size,
                "method": method_name,
                "user_scale": num_users,
                "user_index": u,
                "user_id": user_id,
                "role": role,
                "level": level,
                "latency_ms": lat_ms,
                "comm_bytes": tx_bytes,
                "success": success,
                "cpu_percent": psutil.cpu_percent(interval=None)
            })

        duration_sec = time.perf_counter() - t_batch_start
        throughput_tps = round(committed_count / max(0.001, duration_sec), 2)
        avg_lat = sum(latencies) / len(latencies) if latencies else 0.0
        avg_comm = sum(comm_bytes) / len(comm_bytes) if comm_bytes else 0.0

        for r in user_records:
            r["measured_tps"] = throughput_tps
            r["batch_duration_sec"] = duration_sec
            raw_records.append(r)

        print(f"   Users: {num_users:3d} | Avg Latency: {avg_lat:6.1f} ms | Measured TPS: {throughput_tps:5.2f} TPS | Avg Comm: {avg_comm:5.0f} bytes")

    df = pd.DataFrame(raw_records)
    out_dir = "/home/krishna/internship-blockchain-health/experiments/results/raw"
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"raw_{run_id}.csv")
    df.to_csv(csv_path, index=False)

    print(f"\n✅ Scalability benchmark complete. Saved to:\n   {csv_path}\n")
    return csv_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run User Scalability Benchmark (Figure 6)")
    parser.add_argument("--scales", nargs="+", type=int, default=[10, 20, 50], help="User counts to evaluate")
    parser.add_argument("--method", type=str, default="bgw_broadcast", help="Method name")
    args = parser.parse_args()

    run_scalability_benchmark(user_scales=args.scales, method_name=args.method)
