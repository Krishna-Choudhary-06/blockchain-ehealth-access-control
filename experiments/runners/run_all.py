"""
Master Experiment Orchestrator
Executes benchmarks, processes raw transaction data, and triggers graph generation.

Audited Enhancement:
  - Invokes generate_bgw_vs_single_graphs directly to keep calibrated analytical models synchronized with empirical data.
  - Aligns throughput concurrency defaults ([2, 5]) for clean Low-Rate vs High-Rate panel population.
"""

import os
import sys
import argparse
from datetime import datetime

sys.path.append("/home/krishna/internship-blockchain-health")
from experiments.runners.run_warmup import run_warmup
from experiments.runners.run_latency import run_latency_benchmark
from experiments.runners.run_throughput import run_throughput_benchmark
from experiments.runners.run_communication import run_communication_benchmark
from experiments.runners.run_computation import run_computation_benchmark
from experiments.runners.run_scalability import run_scalability_benchmark
from experiments.runners.run_encryption_eval import run_encryption_evaluation
from experiments.processing.process_results import process_all_raw_results

def main():
    parser = argparse.ArgumentParser(description="Master E-Health Experiment Runner")
    parser.add_argument("--smoke-test", action="store_true", help="Execute fast end-to-end validation across all experiments")
    parser.add_argument("--experiment", type=str, default="all", choices=["all", "latency", "throughput", "communication", "computation", "scalability", "crypto"], help="Specific experiment to run")
    parser.add_argument("--reprocess-only", action="store_true", help="Reprocess existing raw data and redraw figures without re-running tests")
    args = parser.parse_args()

    print("=" * 70)
    print("E-HEALTH BLOCKCHAIN RESEARCH EXPERIMENT SUITE")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print(f"Mode: {'SMOKE TEST' if args.smoke_test else 'FULL EXPERIMENT RUN'}")
    print("=" * 70)

    if not args.reprocess_only:
        # 1. Warm-up
        run_warmup(warmup_count=3 if args.smoke_test else 5)

        # 2. Run experiments based on flags
        if args.experiment in ("all", "latency"):
            wl = [2, 5] if args.smoke_test else [10, 25, 50]
            run_latency_benchmark(workloads=wl, repetitions=1 if args.smoke_test else 3)

        if args.experiment in ("all", "throughput"):
            concurrency = [2, 5] if args.smoke_test else [2, 5, 10]
            txs = 3 if args.smoke_test else 5
            run_throughput_benchmark(concurrency_levels=concurrency, txs_per_level=txs)

        if args.experiment in ("all", "communication"):
            wl = [2, 5] if args.smoke_test else [5, 10, 20]
            run_communication_benchmark(workloads=wl)

        if args.experiment in ("all", "computation"):
            wl = [2, 5] if args.smoke_test else [5, 10, 20]
            run_computation_benchmark(workloads=wl)

        if args.experiment in ("all", "scalability"):
            scales = [5, 10] if args.smoke_test else [10, 20, 30, 50, 100]
            run_scalability_benchmark(user_scales=scales)

        if args.experiment in ("all", "crypto"):
            sizes = [50, 250]
            recs = [2, 5]
            run_encryption_evaluation(file_sizes_kb=sizes, recipient_counts=recs, repetitions=2 if args.smoke_test else 5)

    # 3. Process raw measurements
    print("\n" + "=" * 60)
    print("PROCESSING RAW MEASUREMENTS & GENERATING STATISTICAL SUMMARIES")
    print("=" * 60)
    process_all_raw_results()

    # 4. Generate Figures
    print("\n" + "=" * 60)
    print("GENERATING PUBLICATION-QUALITY FIGURES")
    print("=" * 60)
    import experiments.graphs.figure2_latency as f2
    import experiments.graphs.figure3_throughput as f3
    import experiments.graphs.figure4_communication as f4
    import experiments.graphs.figure5_computation as f5
    import experiments.graphs.figure6_scalability as f6
    import experiments.graphs.figure_comparative_methods as f_comp
    import experiments.graphs.generate_bgw_vs_single_graphs as bgw_graphs

    f2.generate_figure2()
    f3.generate_figure3()
    f4.generate_figure4()
    f5.generate_figure5()
    f6.generate_figure6()
    f_comp.generate_method_comparison_figures()

    # Automatically generate calibrated analytical figures
    params = bgw_graphs.get_calibrated_params()
    data = bgw_graphs.compute_metrics(params)
    out_prefix = os.path.join(bgw_graphs.OUTPUT_DIR, "bgw_vs_single_calibrated")
    bgw_graphs.plot_transactions_grid(data, out_prefix)
    bgw_graphs.plot_users_row(data, out_prefix)
    bgw_graphs.plot_master_dashboard(data, out_prefix)

    print("\n🎉 ALL EXPERIMENTS, STATISTICAL PROCESSING, AND FIGURE GENERATIONS COMPLETE!\n")

if __name__ == "__main__":
    main()
