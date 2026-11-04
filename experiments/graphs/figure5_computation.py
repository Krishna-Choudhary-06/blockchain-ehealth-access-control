"""
Figure 5 Generator: Computation Overhead Comparison
Conforms strictly to Base Paper: Notash et al. (Blockchain: Research and Applications, 2026)
Four-panel layout:
  (a) Block Size = 5 & Low Transaction Rate
  (b) Block Size = 5 & High Transaction Rate
  (c) Block Size = 10 & Low Transaction Rate
  (d) Block Size = 10 & High Transaction Rate
Consumes processed data from experiments/results/processed/computation_summary.csv
"""

import os
import pandas as pd
import matplotlib.pyplot as plt

PROCESSED_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/computation_summary.csv"
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

def generate_figure5():
    os.makedirs(FIGURES_DIR, exist_ok=True)
    if not os.path.exists(PROCESSED_FILE):
        print(f"File not found: {PROCESSED_FILE}. Run benchmarks and process_results.py first.")
        return

    df = pd.read_csv(PROCESSED_FILE)
    if df.empty:
        print("Computation dataset is empty.")
        return

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    panels = [
        {"block_size": 5, "rate_type": "low", "title": "(a) Block Size = 5 & Low Transaction Rate"},
        {"block_size": 5, "rate_type": "high", "title": "(b) Block Size = 5 & High Transaction Rate"},
        {"block_size": 10, "rate_type": "low", "title": "(c) Block Size = 10 & Low Transaction Rate"},
        {"block_size": 10, "rate_type": "high", "title": "(d) Block Size = 10 & High Transaction Rate"}
    ]

    for ax, p in zip(axes.flatten(), panels):
        b = p["block_size"]
        sub = df[df["block_size"] == b]
        if sub.empty:
            ax.set_title(f"{p['title']} (Pending Benchmark)", fontsize=11, fontstyle="italic", color="#666666")
            ax.text(0.5, 0.5, f"Block Size {b}\nPending Benchmark Execution", 
                    ha="center", va="center", transform=ax.transAxes, color="#888888", fontsize=10)
            ax.set_xlabel("Transaction Workload", fontsize=10)
            ax.set_ylabel("Execution Time (ms)", fontsize=10)
            ax.grid(True, linestyle="--", alpha=0.3)
            continue

        # Filter by rate type
        if p["rate_type"] == "low":
            r_sub = sub[sub["workload"] <= 5]
        else:
            r_sub = sub[sub["workload"] > 5]

        if r_sub.empty:
            r_sub = sub

        ax.set_title(p["title"], fontsize=12, fontweight="bold")
        for method in r_sub["method"].unique():
            m_sub = r_sub[r_sub["method"] == method].sort_values("workload")
            ax.plot(
                m_sub["workload"], 
                m_sub["avg_execution_time_ms"], 
                marker=METHOD_MARKERS.get(method, "o"), 
                linewidth=2,
                markersize=7,
                color=METHOD_COLORS.get(method, "#2ca02c"),
                label=METHOD_LABELS.get(method, method.replace("_", " ").title())
            )
            for _, row in m_sub.iterrows():
                ax.annotate(f"{row['avg_execution_time_ms']:.1f} ms",
                            xy=(row["workload"], row["avg_execution_time_ms"]),
                            xytext=(0, 6), textcoords="offset points",
                            ha="center", va="bottom", fontsize=8.5, fontweight="bold")

        ax.set_xlabel("Transaction Workload (Number of Transactions)", fontsize=10)
        ax.set_ylabel("Execution Time (ms)", fontsize=10)
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.legend(fontsize=9, loc="upper left")

    plt.suptitle("Figure 5: Computation Overhead Comparison Across Different Block Sizes and Transaction Rates", 
                 fontsize=13.5, fontweight="bold", y=0.98)
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])

    png_path = os.path.join(FIGURES_DIR, "figure5_computation.png")
    pdf_path = os.path.join(FIGURES_DIR, "figure5_computation.pdf")
    plt.savefig(png_path, dpi=300)
    plt.savefig(pdf_path)
    plt.close()
    print(f"✓ Generated Figure 5: {png_path}")

if __name__ == "__main__":
    generate_figure5()
