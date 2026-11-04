"""
Figure 2 Generator: Average Latency Comparison Across Different Block Sizes
Conforms strictly to Base Paper: Notash et al. (Blockchain: Research and Applications, 2026)
Four-panel layout:
  (a) Block Size = 5
  (b) Block Size = 10
  (c) Block Size = 15
  (d) Block Size = 20
Consumes processed data from experiments/results/processed/latency_summary.csv
"""

import os
import pandas as pd
import matplotlib.pyplot as plt

PROCESSED_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/latency_summary.csv"
FIGURES_DIR = "/home/krishna/internship-blockchain-health/experiments/results/figures"

# Publication styling
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 10,
    "axes.titlesize": 11,
    "legend.fontsize": 9,
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
    "baseline_repeated_encryption": "Baseline Method"
}

def generate_figure2():
    os.makedirs(FIGURES_DIR, exist_ok=True)
    if not os.path.exists(PROCESSED_FILE):
        print(f"File not found: {PROCESSED_FILE}. Run benchmarks and process_results.py first.")
        return

    df = pd.read_csv(PROCESSED_FILE)
    if df.empty:
        print("Latency summary dataset is empty.")
        return

    fig, axes = plt.subplots(2, 2, figsize=(14, 10), sharey=False)
    block_sizes = [5, 10, 15, 20]
    titles = [
        "(a) Block Size = 5",
        "(b) Block Size = 10",
        "(c) Block Size = 15",
        "(d) Block Size = 20"
    ]

    for idx, (b, ax, title) in enumerate(zip(block_sizes, axes.flatten(), titles)):
        sub = df[df["block_size"] == b]
        if sub.empty:
            ax.set_title(f"{title} (Pending Benchmark)", fontsize=11, fontstyle="italic", color="#666666")
            ax.text(0.5, 0.5, f"Block Size {b}\nPending Benchmark Execution", 
                    ha="center", va="center", transform=ax.transAxes, color="#888888", fontsize=10)
            ax.set_xlabel("Transaction Load (Number of Transactions)", fontsize=10)
            ax.set_ylabel("Average Latency (ms)", fontsize=10)
            ax.grid(True, linestyle="--", alpha=0.3)
            continue
        else:
            ax.set_title(title, fontsize=12, fontweight="bold")

        for method in sub["method"].unique():
            m_sub = sub[sub["method"] == method].sort_values("workload")
            ax.plot(
                m_sub["workload"], 
                m_sub["avg_latency_ms"], 
                marker=METHOD_MARKERS.get(method, "o"), 
                color=METHOD_COLORS.get(method, "#2ca02c"),
                label=METHOD_LABELS.get(method, method.replace("_", " ").title()),
                linewidth=2,
                markersize=7
            )
            # Add error bars if std is present
            if "std_latency_ms" in m_sub.columns and not m_sub["std_latency_ms"].isna().all():
                ax.errorbar(
                    m_sub["workload"], 
                    m_sub["avg_latency_ms"], 
                    yerr=m_sub["std_latency_ms"], 
                    fmt="none", 
                    ecolor=METHOD_COLORS.get(method, "#2ca02c"), 
                    alpha=0.4, 
                    capsize=4
                )

        ax.set_xlabel("Transaction Load (Number of Transactions)", fontsize=10)
        ax.set_ylabel("Average Latency (ms)", fontsize=10)
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.legend(fontsize=9, loc="upper left")

    plt.suptitle("Figure 2: Average Latency Comparison Across Different Block Sizes", 
                 fontsize=13.5, fontweight="bold", y=0.98)
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])

    png_path = os.path.join(FIGURES_DIR, "figure2_latency.png")
    pdf_path = os.path.join(FIGURES_DIR, "figure2_latency.pdf")
    plt.savefig(png_path, dpi=300)
    plt.savefig(pdf_path)
    plt.close()
    print(f"✓ Generated Figure 2: {png_path}")

if __name__ == "__main__":
    generate_figure2()
