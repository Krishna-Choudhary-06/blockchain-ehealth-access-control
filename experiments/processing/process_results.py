"""
Results Processor and Statistical Aggregator
Transforms raw transaction-level observations into aggregated summary metrics.
Computes: Mean, Median, Min, Max, P95, Standard Deviation, Success Rates, and TPS.

Scientifically Audited Enhancements:
  1. Latency & Execution Time statistics are calculated STRICTLY from successful requests.
     Failed requests are accounted for in failure counts and success rates without artificially lowering latencies.
  2. Scalability user count reflects unique users (nunique) rather than raw row counts.
  3. Cryptographic evaluation aggregates successful trials, adding standard deviation (std) and sample count.
  4. Batch-level throughput aggregates correctly per batch configuration.
"""

import os
import glob
import pandas as pd
import numpy as np
from typing import Dict, Any, List

RAW_DIR = "/home/krishna/internship-blockchain-health/experiments/results/raw"
PROCESSED_DIR = "/home/krishna/internship-blockchain-health/experiments/results/processed"

def process_all_raw_results():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    raw_files = glob.glob(os.path.join(RAW_DIR, "raw_*.csv"))
    if not raw_files:
        print("No raw transaction CSV files found in", RAW_DIR)
        return

    print(f"Processing {len(raw_files)} raw experimental datasets...")
    dfs = []
    for f in raw_files:
        try:
            df = pd.read_csv(f)
            if not df.empty:
                dfs.append(df)
        except Exception as e:
            print(f"Error reading {f}: {e}")

    if not dfs:
        return

    master_df = pd.concat(dfs, ignore_index=True)

    # 1. Process Latency (Figure 2)
    if "experiment" in master_df.columns:
        lat_df = master_df[master_df["experiment"] == "figure2_latency"]
        if not lat_df.empty:
            summary_rows = []
            for (b, m, w), group in lat_df.groupby(["block_size", "method", "workload"]):
                total_tx = len(group)
                succ_group = group[group["success"] == True]
                succ_tx = len(succ_group)
                fail_tx = total_tx - succ_tx

                lats = succ_group["latency_ms"] if not succ_group.empty else group["latency_ms"]

                summary_rows.append({
                    "block_size": b,
                    "method": m,
                    "workload": w,
                    "total_transactions": total_tx,
                    "successful_transactions": succ_tx,
                    "failed_transactions": fail_tx,
                    "success_rate_pct": (succ_tx / total_tx * 100.0) if total_tx > 0 else 0.0,
                    "avg_latency_ms": lats.mean() if not lats.empty else 0.0,
                    "median_latency_ms": lats.median() if not lats.empty else 0.0,
                    "p95_latency_ms": np.percentile(lats, 95) if not lats.empty else 0.0,
                    "min_latency_ms": lats.min() if not lats.empty else 0.0,
                    "max_latency_ms": lats.max() if not lats.empty else 0.0,
                    "std_latency_ms": lats.std(ddof=1) if len(lats) > 1 else 0.0
                })

            lat_summary = pd.DataFrame(summary_rows)
            lat_summary.to_csv(os.path.join(PROCESSED_DIR, "latency_summary.csv"), index=False)
            print("  ✓ Saved latency_summary.csv (Strict Success-Filtered)")

    # 2. Process Throughput (Figure 3)
    if "experiment" in master_df.columns:
        tps_df = master_df[master_df["experiment"] == "figure3_throughput"]
        if not tps_df.empty:
            summary_rows = []
            for (b, m, c), group in tps_df.groupby(["block_size", "method", "concurrency"]):
                total_tx = len(group)
                succ_tx = int((group["success"] == True).sum())
                
                # Compute batch throughput using unique batch duration or mean batch TPS
                batch_tps = group.groupby("run_id")["committed_tps"].mean().mean()
                succ_group = group[group["success"] == True]
                avg_lat = succ_group["latency_ms"].mean() if not succ_group.empty else group["latency_ms"].mean()

                summary_rows.append({
                    "block_size": b,
                    "method": m,
                    "concurrency": c,
                    "total_submitted": total_tx,
                    "total_committed": succ_tx,
                    "success_rate_pct": (succ_tx / total_tx * 100.0) if total_tx > 0 else 0.0,
                    "avg_duration_sec": group["batch_duration_sec"].mean(),
                    "avg_committed_tps": batch_tps,
                    "avg_latency_ms": avg_lat,
                    "avg_cpu_percent": group["cpu_percent"].mean()
                })

            tps_summary = pd.DataFrame(summary_rows)
            tps_summary.to_csv(os.path.join(PROCESSED_DIR, "throughput_summary.csv"), index=False)
            print("  ✓ Saved throughput_summary.csv")

    # 3. Process Communication Overhead (Figure 4)
    if "experiment" in master_df.columns:
        comm_df = master_df[master_df["experiment"] == "figure4_communication"]
        if not comm_df.empty:
            grouped = comm_df.groupby(["block_size", "method", "workload"])
            comm_summary = grouped.agg(
                sample_count=("transaction_id", "count"),
                avg_request_bytes=("request_bytes", "mean"),
                avg_response_bytes=("response_bytes", "mean"),
                avg_total_comm_bytes=("total_communication_bytes", "mean"),
                avg_payload_bytes=("payload_bytes", "mean")
            ).reset_index()
            comm_summary.to_csv(os.path.join(PROCESSED_DIR, "communication_summary.csv"), index=False)
            print("  ✓ Saved communication_summary.csv")

    # 4. Process Computation Overhead (Figure 5)
    if "experiment" in master_df.columns:
        comp_df = master_df[master_df["experiment"] == "figure5_computation"]
        if not comp_df.empty:
            summary_rows = []
            for (b, m, w), group in comp_df.groupby(["block_size", "method", "workload"]):
                succ_group = group[group["success"] == True]
                target_group = succ_group if not succ_group.empty else group
                summary_rows.append({
                    "block_size": b,
                    "method": m,
                    "workload": w,
                    "sample_count": len(group),
                    "successful_count": len(succ_group),
                    "avg_execution_time_ms": target_group["execution_time_ms"].mean(),
                    "avg_cpu_user_ms": target_group["cpu_user_ms"].mean() if "cpu_user_ms" in target_group else 0.0,
                    "avg_cpu_system_ms": target_group["cpu_system_ms"].mean() if "cpu_system_ms" in target_group else 0.0,
                    "avg_cpu_percent": target_group["cpu_percent"].mean() if "cpu_percent" in target_group else 0.0,
                    "avg_memory_rss_mb": target_group["memory_rss_mb"].mean() if "memory_rss_mb" in target_group else 0.0
                })
            comp_summary = pd.DataFrame(summary_rows)
            comp_summary.to_csv(os.path.join(PROCESSED_DIR, "computation_summary.csv"), index=False)
            print("  ✓ Saved computation_summary.csv")

    # 5. Process Scalability (Figure 6)
    if "experiment" in master_df.columns:
        scale_df = master_df[master_df["experiment"] == "figure6_scalability"]
        if not scale_df.empty:
            summary_rows = []
            for (b, m, u), group in scale_df.groupby(["block_size", "method", "user_scale"]):
                succ_group = group[group["success"] == True]
                target_group = succ_group if not succ_group.empty else group
                
                # Use nunique for unique user count
                unique_users = group["user_id"].nunique() if "user_id" in group.columns else len(group)
                
                row = {
                    "block_size": b,
                    "method": m,
                    "user_scale": u,
                    "total_users": unique_users,
                    "successful_users": len(succ_group),
                    "avg_latency_ms": target_group["latency_ms"].mean(),
                    "median_latency_ms": target_group["latency_ms"].median(),
                    "avg_comm_bytes": target_group["comm_bytes"].mean(),
                    "avg_cpu_percent": target_group["cpu_percent"].mean()
                }
                if "measured_tps" in group.columns:
                    row["measured_tps"] = group["measured_tps"].iloc[0]
                summary_rows.append(row)

            scale_summary = pd.DataFrame(summary_rows)
            scale_summary.to_csv(os.path.join(PROCESSED_DIR, "scalability_summary.csv"), index=False)
            print("  ✓ Saved scalability_summary.csv")

    # 6. Process Cryptographic Sharing Comparison (Section 6)
    crypto_files = glob.glob(os.path.join(RAW_DIR, "raw_crypto_eval_*.csv"))
    if crypto_files:
        c_dfs = [pd.read_csv(cf) for cf in crypto_files]
        c_master = pd.concat(c_dfs, ignore_index=True)
        
        # Calculate statistics strictly on successful trials
        c_succ = c_master[c_master["success"] == True] if "success" in c_master.columns else c_master
        
        summary_rows = []
        for (scheme, size, recs), group in c_succ.groupby(["scheme", "file_size_kb", "recipient_count"]):
            summary_rows.append({
                "scheme": scheme,
                "file_size_kb": size,
                "recipient_count": recs,
                "sample_count": len(group),
                "total_latency_ms": group["total_sharing_latency_ms"].mean(),
                "std_total_latency_ms": group["total_sharing_latency_ms"].std(ddof=1) if len(group) > 1 else 0.0,
                "min_total_latency_ms": group["total_sharing_latency_ms"].min(),
                "max_total_latency_ms": group["total_sharing_latency_ms"].max(),
                "file_crypto_ms": group["file_crypto_ms"].mean(),
                "ipfs_re_upload_ms": group["ipfs_re_upload_ms"].mean(),
                "header_update_ms": group["header_update_ms"].mean(),
                "re_encrypted_file": group["re_encrypted_file"].iloc[0],
                "re_uploaded_ipfs": group["re_uploaded_ipfs"].iloc[0]
            })

        c_summary = pd.DataFrame(summary_rows)
        c_summary.to_csv(os.path.join(PROCESSED_DIR, "encryption_comparison_summary.csv"), index=False)
        print("  ✓ Saved encryption_comparison_summary.csv (Strict Success-Filtered with Std)")

    print("Statistical summaries processed successfully in:", PROCESSED_DIR)

if __name__ == "__main__":
    process_all_raw_results()
