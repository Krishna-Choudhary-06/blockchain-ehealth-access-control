"""
Comparative Methods Figure Generator (Extensible Multi-Method Research Evaluation)
Dynamically plots comparative charts for ANY registered methods in MethodRegistry.
Compares:
  1. Sharing with Additional Doctor Latency (ms) vs File Size (with Std Error Bars and Explicit Aggregation Labeling)
  2. Computational Breakdown: Re-encryption vs IPFS Upload vs Blockchain Policy Update
Consumes processed data from experiments/results/processed/encryption_comparison_summary.csv
"""

import os
import pandas as pd
import matplotlib.pyplot as plt

PROCESSED_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/encryption_comparison_summary.csv"
FIGURES_DIR = "/home/krishna/internship-blockchain-health/experiments/results/figures"

# Publication styling
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 11,
    "axes.titlesize": 12,
    "legend.fontsize": 10,
    "grid.color": "#e0e0e0",
    "grid.linestyle": "--",
    "grid.alpha": 0.7,
})

def generate_method_comparison_figures():
    os.makedirs(FIGURES_DIR, exist_ok=True)
    if not os.path.exists(PROCESSED_FILE):
        print(f"File not found: {PROCESSED_FILE}. Run run_encryption_eval.py first.")
        return

    df = pd.read_csv(PROCESSED_FILE)
    if df.empty:
        print("Dataset is empty.")
        return

    # 1. Bar Chart: Sharing Latency vs File Size
    plt.figure(figsize=(9, 5.5))
    schemes = df["scheme"].unique()
    file_sizes = sorted(df["file_size_kb"].unique())
    rec_counts = sorted(df["recipient_count"].unique()) if "recipient_count" in df.columns else []
    rec_str = f"(Mean across N = {', '.join(map(str, rec_counts))} Recipients)" if rec_counts else ""

    colors = {
        "Proposed (BGW Broadcast)": "#1f77b4",
        "Baseline (Repeated Re-encryption)": "#d62728"
    }

    width = 0.35
    x_indices = list(range(len(file_sizes)))

    for i, scheme in enumerate(schemes):
        sub = df[df["scheme"] == scheme]
        latencies = []
        errors = []
        for sz in file_sizes:
            sz_sub = sub[sub["file_size_kb"] == sz]
            latencies.append(sz_sub["total_latency_ms"].mean())
            if "std_total_latency_ms" in sz_sub.columns and not sz_sub["std_total_latency_ms"].isna().all():
                errors.append(sz_sub["std_total_latency_ms"].mean())
            else:
                errors.append(0.0)

        offset = (i - len(schemes) / 2.0 + 0.5) * width
        rects = plt.bar(
            [x + offset for x in x_indices],
            latencies,
            yerr=errors if any(e > 0 for e in errors) else None,
            capsize=4,
            width=width,
            label=scheme,
            color=colors.get(scheme, "#333333"),
            alpha=0.88,
            edgecolor="#222222",
            linewidth=0.8
        )
        for rect in rects:
            h = rect.get_height()
            plt.annotate(f"{h:.1f} ms",
                         xy=(rect.get_x() + rect.get_width() / 2, h),
                         xytext=(0, 4), textcoords="offset points",
                         ha="center", va="bottom", fontsize=8.5, fontweight="bold")

    plt.xlabel("Medical File Size (KB)", fontsize=11, fontweight="bold")
    plt.ylabel("Time to Grant Access to Additional Doctor (ms)", fontsize=11, fontweight="bold")
    plt.title(f"Empirical Sharing Overhead Across Medical File Sizes {rec_str}\n(BGW Header Update vs. Baseline Re-encryption)", fontsize=11.5, fontweight="bold")
    plt.xticks(x_indices, [f"{sz} KB" for sz in file_sizes])
    plt.grid(True, axis="y")
    plt.legend(loc="upper left")
    plt.tight_layout()

    out_file1 = os.path.join(FIGURES_DIR, "comparative_sharing_latency_vs_filesize.png")
    plt.savefig(out_file1, dpi=300)
    plt.savefig(out_file1.replace(".png", ".pdf"))
    plt.close()
    print(f"✓ Generated Comparative Plot: {out_file1}")

    # 2. Stacked Breakdown Chart: Re-encryption vs IPFS vs Blockchain
    plt.figure(figsize=(9, 5.5))
    max_sz = max(file_sizes)
    sub_max_df = df[df["file_size_kb"] == max_sz]
    sub_max = sub_max_df.groupby("scheme", as_index=False).mean()

    methods = sub_max["scheme"].tolist()
    re_enc = sub_max["file_crypto_ms"].tolist()
    ipfs_up = sub_max["ipfs_re_upload_ms"].tolist()
    header_up = sub_max["header_update_ms"].tolist()

    p1 = plt.bar(methods, re_enc, width=0.45, color="#d62728", label="Client File Re-encryption (ms)", edgecolor="#222", linewidth=0.8)
    p2 = plt.bar(methods, ipfs_up, width=0.45, bottom=re_enc, color="#ff7f0e", label="IPFS Ciphertext Re-upload (ms)", edgecolor="#222", linewidth=0.8)
    bottom_for_header = [r + i for r, i in zip(re_enc, ipfs_up)]
    p3 = plt.bar(methods, header_up, width=0.45, bottom=bottom_for_header, color="#2ca02c", label="Fabric Smart Contract Policy Update (ms)", edgecolor="#222", linewidth=0.8)

    # Annotate total height
    total_heights = [r + i + h for r, i, h in zip(re_enc, ipfs_up, header_up)]
    for idx, (m, tot) in enumerate(zip(methods, total_heights)):
        plt.annotate(f"Total: {tot:.1f} ms",
                     xy=(idx, tot),
                     xytext=(0, 4), textcoords="offset points",
                     ha="center", va="bottom", fontsize=9, fontweight="bold")

    plt.ylabel("Execution Duration (ms)", fontsize=11, fontweight="bold")
    plt.title(f"Time Breakdown: Adding a New Doctor ({max_sz} KB File)\nEmpirical Measurement on Live Blockchain + IPFS Nodes", fontsize=11.5, fontweight="bold")
    plt.legend(loc="upper right")
    plt.grid(True, axis="y")
    plt.ylim(0, max(total_heights) * 1.25)
    plt.tight_layout()

    out_file2 = os.path.join(FIGURES_DIR, "comparative_time_breakdown.png")
    plt.savefig(out_file2, dpi=300)
    plt.savefig(out_file2.replace(".png", ".pdf"))
    plt.close()
    print(f"✓ Generated Comparative Breakdown Plot: {out_file2}")

if __name__ == "__main__":
    generate_method_comparison_figures()
