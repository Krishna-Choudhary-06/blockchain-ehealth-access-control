"""
Figure 6 Generator: User Scalability Evaluation
Conforms strictly to Base Paper: Notash et al. (Blockchain: Research and Applications, 2026)
Performance comparison of the PROPOSED METHOD with baseline methods under varying numbers of users:
  (a) Transaction latency in seconds
  (b) Throughput (TPS)
  (c) Communication overhead in KB
Consumes processed data from experiments/results/processed/scalability_summary.csv
"""

import os
import pandas as pd
import matplotlib.pyplot as plt

PROCESSED_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/scalability_summary.csv"
FIGURES_DIR = "/home/krishna/internship-blockchain-health/experiments/results/figures"

# Publication styling
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 10.5,
    "axes.titlesize": 11.5,
    "legend.fontsize": 9.5,
    "grid.color": "#e0e0e0",
    "grid.linestyle": "--",
    "grid.alpha": 0.7,
})

METHOD_COLORS = {
    "bgw_broadcast": "#1f77b4",                 # Proposed Method: Deep Blue
    "baseline_repeated_encryption": "#d62728"   # Baseline Method: Crimson Red
}
METHOD_MARKERS = {
    "bgw_broadcast": "o",
    "baseline_repeated_encryption": "s"
}
METHOD_LABELS = {
    "bgw_broadcast": "Proposed Method (BGW)",
    "baseline_repeated_encryption": "Baseline Method (Single/Repeated)"
}

def generate_figure6():
    os.makedirs(FIGURES_DIR, exist_ok=True)
    if not os.path.exists(PROCESSED_FILE):
        print(f"File not found: {PROCESSED_FILE}. Run benchmarks and process_results.py first.")
        return

    df = pd.read_csv(PROCESSED_FILE)
    if df.empty:
        print("Scalability dataset is empty.")
        return

    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(18, 5.2))
    methods = df["method"].unique()

    # 6a. Transaction Latency in Seconds
    ax1.set_title("(a) Transaction Latency in Seconds", fontsize=12, fontweight="bold")
    for method in methods:
        sub = df[df["method"] == method].sort_values("user_scale")
        # Convert ms to seconds as per base paper
        lat_sec = sub["avg_latency_ms"] / 1000.0
        ax1.plot(
            sub["user_scale"], 
            lat_sec, 
            marker=METHOD_MARKERS.get(method, "o"), 
            color=METHOD_COLORS.get(method, "#1f77b4"),
            linewidth=2, 
            markersize=7,
            label=METHOD_LABELS.get(method, method.replace("_", " ").title())
        )
    ax1.set_xlabel("Number of Users (Clients)", fontsize=10.5, fontweight="bold")
    ax1.set_ylabel("Latency (Seconds)", fontsize=10.5, fontweight="bold")
    ax1.grid(True)
    ax1.legend(loc="upper left")

    # 6b. Throughput (TPS)
    ax2.set_title("(b) Throughput (TPS)", fontsize=12, fontweight="bold")
    for method in methods:
        sub = df[df["method"] == method].sort_values("user_scale")
        if "measured_tps" in sub.columns and not sub["measured_tps"].isna().all() and (sub["measured_tps"] > 0).any():
            y_vals = sub["measured_tps"]
        else:
            # Derived throughput from batch duration and transaction latency
            y_vals = sub["user_scale"] / (sub["avg_latency_ms"] / 1000.0)
        ax2.plot(
            sub["user_scale"], 
            y_vals, 
            marker=METHOD_MARKERS.get(method, "s"), 
            color=METHOD_COLORS.get(method, "#d62728"),
            linewidth=2, 
            markersize=7,
            label=METHOD_LABELS.get(method, method.replace("_", " ").title())
        )
    ax2.set_xlabel("Number of Users (Clients)", fontsize=10.5, fontweight="bold")
    ax2.set_ylabel("Committed Throughput (TPS)", fontsize=10.5, fontweight="bold")
    ax2.grid(True)
    ax2.legend(loc="upper left")

    # 6c. Communication Overhead in KB
    ax3.set_title("(c) Communication Overhead in KB", fontsize=12, fontweight="bold")
    for method in methods:
        sub = df[df["method"] == method].sort_values("user_scale")
        ax3.plot(
            sub["user_scale"], 
            sub["avg_comm_bytes"] / 1024.0, 
            marker=METHOD_MARKERS.get(method, "^"), 
            color=METHOD_COLORS.get(method, "#1f77b4"),
            linewidth=2, 
            markersize=7,
            label=METHOD_LABELS.get(method, method.replace("_", " ").title())
        )
    ax3.set_xlabel("Number of Users (Clients)", fontsize=10.5, fontweight="bold")
    ax3.set_ylabel("Communication Overhead (KB)", fontsize=10.5, fontweight="bold")
    ax3.grid(True)
    ax3.legend(loc="upper left")

    plt.suptitle("Figure 6: Performance Comparison of the PROPOSED METHOD with Baseline Methods Under Varying Numbers of Users", 
                 fontsize=13.5, fontweight="bold", y=1.02)
    plt.tight_layout()

    png_path = os.path.join(FIGURES_DIR, "figure6_scalability.png")
    pdf_path = os.path.join(FIGURES_DIR, "figure6_scalability.pdf")
    plt.savefig(png_path, dpi=300, bbox_inches="tight")
    plt.savefig(pdf_path, bbox_inches="tight")
    plt.close()
    print(f"✓ Generated Figure 6: {png_path}")

if __name__ == "__main__":
    generate_figure6()
