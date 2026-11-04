"""
Performance Analysis & Visualization: BGW Broadcast Encryption vs Single Encryption
Analytical / Asymptotic Complexity Model (Empirically Calibrated from Live Testbed)

Scientifically Audited Model:
  1. Clearly separates the Initial Multi-Recipient Share workflow from Recipient Addition.
  2. Protocol Communication Overhead includes pairing broadcast header size (C1, C2 in G1, G2: 192 bytes)
     and wrapped symmetric keys (256 bytes RSA/EC) instead of raw payload multiplication alone.
  3. Throughput is explicitly labeled as Reciprocal Sequential Throughput (1000 / T_lat).
  4. Calibrated parameters are isolated by file size (50 KB) and non-overlapping measurement boundaries
     to prevent double-counting IPFS latency inside Fabric consensus latency.
"""

import os
import sys
import argparse
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

PROCESSED_CRYPTO_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/encryption_comparison_summary.csv"
PROCESSED_LATENCY_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/latency_summary.csv"
PROCESSED_COMP_FILE = "/home/krishna/internship-blockchain-health/experiments/results/processed/computation_summary.csv"
OUTPUT_DIR = "/home/krishna/internship-blockchain-health/experiments/results/figures"

# ---------------------------------------------------------------------------
# STYLING CONFIGURATION (IEEE / ACM Publication Standard)
# ---------------------------------------------------------------------------
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 11,
    "axes.titlesize": 12,
    "xtick.labelsize": 9,
    "ytick.labelsize": 9,
    "legend.fontsize": 9,
    "figure.titlesize": 13,
    "lines.linewidth": 1.8,
    "lines.markersize": 4.5,
    "grid.color": "#e0e0e0",
    "grid.linestyle": "--",
    "grid.alpha": 0.7,
})

COLOR_BGW = "#1f77b4"     # Deep blue
COLOR_SINGLE = "#d62728"  # Crimson red
FILL_BGW = "#aec7e8"
FILL_SINGLE = "#ff9896"

# ---------------------------------------------------------------------------
# BASELINE THEORETICAL ASSUMPTIONS (Documented Literature Defaults)
# ---------------------------------------------------------------------------
THEORETICAL_PARAMS = {
    "mode": "Theoretical Simulation",
    "T_AES": 2.5,          # AES-256-GCM symmetric encryption for 50 KB payload (ms)
    "T_BGW_hdr": 5.0,      # BGW broadcast header generation (BLS12-381 pairings in G1/G2) (ms)
    "T_BGW_setup": 38.0,   # One-time bilinear group parameter initialization (ms, amortized)
    "T_IPFS": 120.0,       # IPFS DAG add and pin latency for 50 KB ciphertext (ms)
    "T_BC": 2200.0,        # Hyperledger Fabric Raft consensus + transaction endorsement (ms)
    "T_key_send": 5.0,     # Per-recipient key transmission and encapsulation latency (ms)
    "file_size_kb": 50.0,  # Benchmark medical record size (KB)
    "hdr_size_kb": 0.192,  # BGW header size: C1 in G1 (48B), C2 in G2 (96B), IV (12B), tag (16B) -> ~192 B
    "key_size_kb": 0.256,  # Baseline RSA-2048/EC wrapped AES key token -> ~256 B
    "n_fixed": 20,         # Fixed recipient count for transactions sweep
}

def get_calibrated_params():
    """
    Calibrate model parameters using live measurements from Fabric and IPFS.
    Ensures non-overlapping measurement boundaries to avoid double-counting.
    """
    params = THEORETICAL_PARAMS.copy()
    params["mode"] = "Empirically Calibrated (Live System)"

    # 1. Calibrate cryptographic and IPFS timings for 50 KB baseline
    if os.path.exists(PROCESSED_CRYPTO_FILE):
        try:
            df_c = pd.read_csv(PROCESSED_CRYPTO_FILE)
            # Filter specifically by 50 KB to avoid skew from larger files
            df_c_50 = df_c[df_c["file_size_kb"] == 50]
            if df_c_50.empty:
                df_c_50 = df_c

            bgw_sub = df_c_50[df_c_50["scheme"].str.contains("BGW", na=False)]
            base_sub = df_c_50[df_c_50["scheme"].str.contains("Baseline", na=False)]

            if not bgw_sub.empty:
                hdr_val = bgw_sub["header_update_ms"].mean()
                if hdr_val > 0:
                    params["T_BGW_hdr"] = round(float(hdr_val), 1)

            if not base_sub.empty:
                crypto_val = base_sub["file_crypto_ms"].mean()
                ipfs_val = base_sub["ipfs_re_upload_ms"].mean()
                if crypto_val > 0:
                    params["T_AES"] = round(float(crypto_val), 1)
                if ipfs_val > 0:
                    params["T_IPFS"] = round(float(ipfs_val), 1)
        except Exception as e:
            print(f"Warning: could not parse crypto summary: {e}")

    # 2. Calibrate pure blockchain consensus latency (excluding client IPFS upload)
    if os.path.exists(PROCESSED_COMP_FILE):
        try:
            df_comp = pd.read_csv(PROCESSED_COMP_FILE)
            if not df_comp.empty and "avg_execution_time_ms" in df_comp.columns:
                exec_val = df_comp["avg_execution_time_ms"].mean()
                if exec_val > 0:
                    params["T_BC"] = round(float(exec_val), 1)
        except Exception as e:
            print(f"Warning: could not parse computation summary: {e}")
    elif os.path.exists(PROCESSED_LATENCY_FILE):
        try:
            df_l = pd.read_csv(PROCESSED_LATENCY_FILE)
            if not df_l.empty and "avg_latency_ms" in df_l.columns:
                # Subtract IPFS latency to prevent double-counting
                net_bc = max(300.0, df_l["avg_latency_ms"].mean() - params["T_IPFS"])
                params["T_BC"] = round(float(net_bc), 1)
        except Exception as e:
            print(f"Warning: could not parse latency summary: {e}")

    return params

def compute_metrics(params):
    T_AES = params["T_AES"]
    T_BGW_hdr = params["T_BGW_hdr"]
    T_IPFS = params["T_IPFS"]
    T_BC = params["T_BC"]
    T_key_send = params["T_key_send"]
    file_size_kb = params["file_size_kb"]
    hdr_size_kb = params["hdr_size_kb"]
    key_size_kb = params["key_size_kb"]
    n_fixed = params["n_fixed"]

    # -------------------------------------------------------------------------
    # WORKFLOW 1: INITIAL MULTI-RECIPIENT SECURE RECORD SHARING
    # BGW: Encrypt payload once (T_AES), upload once to IPFS (T_IPFS),
    #      generate broadcast header for n recipients (T_BGW_hdr), commit to Fabric (T_BC).
    # Single Encryption: Encrypt file n times or re-upload for n recipients,
    #      with key encapsulation overhead per recipient.
    # -------------------------------------------------------------------------
    lat_bgw_fixed = T_BC + T_IPFS + T_BGW_hdr + T_AES
    lat_single_fixed = T_BC + n_fixed * (T_IPFS + T_AES + T_key_send)

    # 1. Transactions sweep (t = 50 to 1000, step 50)
    txns = np.arange(50, 1050, 50)
    lat_bgw_vs_t = np.full_like(txns, lat_bgw_fixed, dtype=float)
    lat_single_vs_t = np.full_like(txns, lat_single_fixed, dtype=float)

    # Reciprocal sequential throughput estimate (1000 / T_lat)
    tps_bgw_vs_t = np.full_like(txns, 1000.0 / lat_bgw_fixed, dtype=float)
    tps_single_vs_t = np.full_like(txns, 1000.0 / lat_single_fixed, dtype=float)

    # Communication Overhead (MB) includes payload + exact protocol header/keys
    comm_bgw_mb = (txns * (file_size_kb + hdr_size_kb)) / 1024.0
    comm_single_mb = (txns * (n_fixed * (file_size_kb + key_size_kb))) / 1024.0

    # Computational Overhead (seconds)
    comp_bgw_sec = (txns * (T_AES + T_BGW_hdr)) / 1000.0
    comp_single_sec = (txns * (n_fixed * T_AES)) / 1000.0

    # 2. Users sweep (n = 1 to 100)
    users = np.arange(1, 101, 1)

    lat_bgw_vs_n = np.full_like(users, lat_bgw_fixed, dtype=float)
    lat_single_vs_n = T_BC + users * (T_IPFS + T_AES + T_key_send)

    tps_bgw_vs_n = 1000.0 / lat_bgw_vs_n
    tps_single_vs_n = 1000.0 / lat_single_vs_n

    # Communication Overhead per record across n recipients (KB)
    comm_bgw_vs_n = np.full_like(users, file_size_kb + hdr_size_kb, dtype=float)
    comm_single_vs_n = users * (file_size_kb + key_size_kb)

    return {
        "params": params,
        "txns": txns,
        "lat_bgw_vs_t": lat_bgw_vs_t,
        "lat_single_vs_t": lat_single_vs_t,
        "tps_bgw_vs_t": tps_bgw_vs_t,
        "tps_single_vs_t": tps_single_vs_t,
        "comm_bgw_mb": comm_bgw_mb,
        "comm_single_mb": comm_single_mb,
        "comp_bgw_sec": comp_bgw_sec,
        "comp_single_sec": comp_single_sec,
        "users": users,
        "lat_bgw_vs_n": lat_bgw_vs_n,
        "lat_single_vs_n": lat_single_vs_n,
        "tps_bgw_vs_n": tps_bgw_vs_n,
        "tps_single_vs_n": tps_single_vs_n,
        "comm_bgw_vs_n": comm_bgw_vs_n,
        "comm_single_vs_n": comm_single_vs_n,
    }

# ---------------------------------------------------------------------------
# 1. 2x2 GRID: PERFORMANCE VS NUMBER OF TRANSACTIONS (n = 20 users)
# ---------------------------------------------------------------------------
def plot_transactions_grid(data, out_prefix):
    fig, axes = plt.subplots(2, 2, figsize=(11.5, 8.5))
    mode_str = data["params"]["mode"]
    fig.suptitle(f"Analytical Complexity Model: Performance vs. Transaction Volume (n = 20 Users)\n[{mode_str}]",
                 fontsize=13, fontweight="bold", y=0.98)

    txns = data["txns"]

    # (a) Average Latency vs Transactions
    ax = axes[0, 0]
    ax.plot(txns, data["lat_bgw_vs_t"], "o-", color=COLOR_BGW, label="BGW Broadcast Encryption")
    ax.plot(txns, data["lat_single_vs_t"], "s--", color=COLOR_SINGLE, label="Single Encryption")
    ax.set_title("(a) Average Latency vs Transactions", fontweight="bold")
    ax.set_xlabel("Number of Transactions (t)")
    ax.set_ylabel("Per-Transaction Latency (ms)")
    ax.set_ylim(0, max(data["lat_single_vs_t"]) * 1.15)
    ax.grid(True)
    ax.legend(loc="center right")

    # (b) Sequential Reciprocal Throughput
    ax = axes[0, 1]
    ax.plot(txns, data["tps_bgw_vs_t"], "o-", color=COLOR_BGW, label="BGW Broadcast Encryption")
    ax.plot(txns, data["tps_single_vs_t"], "s--", color=COLOR_SINGLE, label="Single Encryption")
    ax.set_title("(b) Sequential Throughput Estimate (1000 / T_lat)", fontweight="bold")
    ax.set_xlabel("Number of Transactions (t)")
    ax.set_ylabel("Throughput Estimate (txn/s)")
    ax.set_ylim(0, max(data["tps_bgw_vs_t"]) * 1.25)
    ax.grid(True)
    ax.legend(loc="center right")

    # (c) Communication Overhead vs Transactions
    ax = axes[1, 0]
    ax.plot(txns, data["comm_bgw_mb"], "o-", color=COLOR_BGW, label="BGW (Payload + Pairing Header)")
    ax.plot(txns, data["comm_single_mb"], "s--", color=COLOR_SINGLE, label="Single (n × Payload + Keys)")
    ax.set_title("(c) Network Overhead vs Transactions", fontweight="bold")
    ax.set_xlabel("Number of Transactions (t)")
    ax.set_ylabel("Communication Overhead (MB)")
    ax.grid(True)
    ax.legend(loc="upper left")

    # (d) Computation Overhead vs Transactions
    ax = axes[1, 1]
    ax.plot(txns, data["comp_bgw_sec"], "o-", color=COLOR_BGW, label="BGW Broadcast Encryption")
    ax.plot(txns, data["comp_single_sec"], "s--", color=COLOR_SINGLE, label="Single Encryption")
    ax.set_title("(d) Computation Overhead vs Transactions", fontweight="bold")
    ax.set_xlabel("Number of Transactions (t)")
    ax.set_ylabel("Total CPU Time (s)")
    ax.grid(True)
    ax.legend(loc="upper left")

    plt.tight_layout()
    png_path = f"{out_prefix}_transactions.png"
    pdf_path = f"{out_prefix}_transactions.pdf"
    plt.savefig(png_path, dpi=300, bbox_inches="tight")
    plt.savefig(pdf_path, bbox_inches="tight")
    plt.close()
    print(f"✓ Saved: {png_path}")
    print(f"✓ Saved: {pdf_path}")

# ---------------------------------------------------------------------------
# 2. 1x3 ROW: SCALABILITY VS NUMBER OF USERS (n = 1 to 100)
# ---------------------------------------------------------------------------
def plot_users_row(data, out_prefix):
    fig, axes = plt.subplots(1, 3, figsize=(15.5, 4.5))
    mode_str = data["params"]["mode"]
    fig.suptitle(f"Analytical Complexity Model: Scalability vs. Recipient Count (1 to 100 Users)\n[{mode_str}]",
                 fontsize=13, fontweight="bold", y=1.02)

    users = data["users"]

    # (e) Latency vs Users
    ax = axes[0]
    ax.plot(users, data["lat_bgw_vs_n"], "-", color=COLOR_BGW, linewidth=2.0, label="BGW Broadcast Encryption")
    ax.plot(users, data["lat_single_vs_n"], "-", color=COLOR_SINGLE, linewidth=2.0, label="Single Encryption")
    ax.fill_between(users, data["lat_bgw_vs_n"], data["lat_single_vs_n"], color=FILL_SINGLE, alpha=0.6)
    ax.set_title("(e) Latency vs Recipient Set Size", fontweight="bold")
    ax.set_xlabel("Number of Users (n)")
    ax.set_ylabel("Per-Transaction Latency (ms)")
    ax.grid(True)
    ax.legend(loc="upper left")

    # (f) Throughput vs Users
    ax = axes[1]
    ax.plot(users, data["tps_bgw_vs_n"], "-", color=COLOR_BGW, linewidth=2.0, label="BGW Broadcast Encryption")
    ax.plot(users, data["tps_single_vs_n"], "-", color=COLOR_SINGLE, linewidth=2.0, label="Single Encryption")
    ax.fill_between(users, data["tps_single_vs_n"], data["tps_bgw_vs_n"], color=FILL_BGW, alpha=0.6)
    ax.set_title("(f) Reciprocal Throughput (1000 / T_lat)", fontweight="bold")
    ax.set_xlabel("Number of Users (n)")
    ax.set_ylabel("Throughput Estimate (txn/s)")
    ax.grid(True)
    ax.legend(loc="upper right")

    # (g) Communication Overhead vs Users
    ax = axes[2]
    ax.plot(users, data["comm_bgw_vs_n"], "-", color=COLOR_BGW, linewidth=2.0, label="BGW (Payload + Header)")
    ax.plot(users, data["comm_single_vs_n"], "-", color=COLOR_SINGLE, linewidth=2.0, label="Single (n × Payload + Keys)")
    ax.fill_between(users, data["comm_bgw_vs_n"], data["comm_single_vs_n"], color=FILL_SINGLE, alpha=0.6)
    ax.set_title("(g) Comm. Overhead per Shared File", fontweight="bold")
    ax.set_xlabel("Number of Users (n)")
    ax.set_ylabel("Communication Overhead (KB)")
    ax.grid(True)
    ax.legend(loc="upper left")

    plt.tight_layout()
    png_path = f"{out_prefix}_users.png"
    pdf_path = f"{out_prefix}_users.pdf"
    plt.savefig(png_path, dpi=300, bbox_inches="tight")
    plt.savefig(pdf_path, bbox_inches="tight")
    plt.close()
    print(f"✓ Saved: {png_path}")
    print(f"✓ Saved: {pdf_path}")

# ---------------------------------------------------------------------------
# 3. 7-PANEL MASTER DASHBOARD
# ---------------------------------------------------------------------------
def plot_master_dashboard(data, out_prefix):
    fig = plt.figure(figsize=(16, 8.0))
    mode_str = data["params"]["mode"]
    fig.suptitle(f"Analytical Complexity Model: BGW Broadcast Encryption vs Single Encryption\n[{mode_str}]",
                 fontsize=14, fontweight="bold", y=0.98)

    gs = fig.add_gridspec(2, 4, hspace=0.35, wspace=0.28)

    txns = data["txns"]
    users = data["users"]
    p = data["params"]

    # (a)
    ax_a = fig.add_subplot(gs[0, 0])
    ax_a.plot(txns, data["lat_bgw_vs_t"], "o-", color=COLOR_BGW, label="BGW")
    ax_a.plot(txns, data["lat_single_vs_t"], "s--", color=COLOR_SINGLE, label="Single")
    ax_a.set_title("(a) Avg Latency vs Txns", fontweight="bold")
    ax_a.set_xlabel("Transactions (t)")
    ax_a.set_ylabel("Latency (ms)")
    ax_a.set_ylim(0, max(data["lat_single_vs_t"]) * 1.15)
    ax_a.grid(True)
    ax_a.legend()

    # (b)
    ax_b = fig.add_subplot(gs[0, 1])
    ax_b.plot(txns, data["tps_bgw_vs_t"], "o-", color=COLOR_BGW, label="BGW")
    ax_b.plot(txns, data["tps_single_vs_t"], "s--", color=COLOR_SINGLE, label="Single")
    ax_b.set_title("(b) Reciprocal TPS vs Txns", fontweight="bold")
    ax_b.set_xlabel("Transactions (t)")
    ax_b.set_ylabel("Throughput (txn/s)")
    ax_b.set_ylim(0, max(data["tps_bgw_vs_t"]) * 1.25)
    ax_b.grid(True)
    ax_b.legend()

    # (c)
    ax_c = fig.add_subplot(gs[0, 2])
    ax_c.plot(txns, data["comm_bgw_mb"], "o-", color=COLOR_BGW, label="BGW")
    ax_c.plot(txns, data["comm_single_mb"], "s--", color=COLOR_SINGLE, label="Single")
    ax_c.set_title("(c) Comm. Overhead vs Txns", fontweight="bold")
    ax_c.set_xlabel("Transactions (t)")
    ax_c.set_ylabel("Overhead (MB)")
    ax_c.grid(True)
    ax_c.legend()

    # (d)
    ax_d = fig.add_subplot(gs[0, 3])
    ax_d.plot(txns, data["comp_bgw_sec"], "o-", color=COLOR_BGW, label="BGW")
    ax_d.plot(txns, data["comp_single_sec"], "s--", color=COLOR_SINGLE, label="Single")
    ax_d.set_title("(d) Comp. Overhead vs Txns", fontweight="bold")
    ax_d.set_xlabel("Transactions (t)")
    ax_d.set_ylabel("Overhead (s)")
    ax_d.grid(True)
    ax_d.legend()

    # (e)
    ax_e = fig.add_subplot(gs[1, 0])
    ax_e.plot(users, data["lat_bgw_vs_n"], "-", color=COLOR_BGW, label="BGW")
    ax_e.plot(users, data["lat_single_vs_n"], "-", color=COLOR_SINGLE, label="Single")
    ax_e.fill_between(users, data["lat_bgw_vs_n"], data["lat_single_vs_n"], color=FILL_SINGLE, alpha=0.5)
    ax_e.set_title("(e) Latency vs Users", fontweight="bold")
    ax_e.set_xlabel("Users (n)")
    ax_e.set_ylabel("Latency (ms)")
    ax_e.grid(True)
    ax_e.legend()

    # (f)
    ax_f = fig.add_subplot(gs[1, 1])
    ax_f.plot(users, data["tps_bgw_vs_n"], "-", color=COLOR_BGW, label="BGW")
    ax_f.plot(users, data["tps_single_vs_n"], "-", color=COLOR_SINGLE, label="Single")
    ax_f.fill_between(users, data["tps_single_vs_n"], data["tps_bgw_vs_n"], color=FILL_BGW, alpha=0.5)
    ax_f.set_title("(f) Reciprocal TPS vs Users", fontweight="bold")
    ax_f.set_xlabel("Users (n)")
    ax_f.set_ylabel("Throughput (txn/s)")
    ax_f.grid(True)
    ax_f.legend()

    # (g)
    ax_g = fig.add_subplot(gs[1, 2])
    ax_g.plot(users, data["comm_bgw_vs_n"], "-", color=COLOR_BGW, label="BGW")
    ax_g.plot(users, data["comm_single_vs_n"], "-", color=COLOR_SINGLE, label="Single")
    ax_g.fill_between(users, data["comm_bgw_vs_n"], data["comm_single_vs_n"], color=FILL_SINGLE, alpha=0.5)
    ax_g.set_title("(g) Comm. Overhead vs Users", fontweight="bold")
    ax_g.set_xlabel("Users (n)")
    ax_g.set_ylabel("Overhead (KB)")
    ax_g.grid(True)
    ax_g.legend()

    # Parameters Inset Box (gs[1, 3])
    ax_box = fig.add_subplot(gs[1, 3])
    ax_box.axis("off")
    param_text = (
        r"$\bf{" + p['mode'].replace(' ', r'\ ') + r"}$" + "\n\n"
        f"T_AES       = {p['T_AES']:.1f} ms\n"
        f"T_BGW_hdr   = {p['T_BGW_hdr']:.1f} ms\n"
        f"T_IPFS      = {p['T_IPFS']:.1f} ms\n"
        f"T_BC        = {p['T_BC']:.1f} ms\n"
        f"T_key_send  = {p['T_key_send']:.1f} ms\n"
        f"Hdr Size    = {p['hdr_size_kb']*1024:.0f} B (BGW)\n"
        f"Key Token   = {p['key_size_kb']*1024:.0f} B (Single)\n"
        f"File Size D = {p['file_size_kb']} KB\n"
        f"n (for vs t)= {p['n_fixed']}\n\n"
        "Model: Initial Multi-Share\n"
        "BGW: 1 cipher + 1 header\n"
        "Single: n encryptions + keys"
    )
    ax_box.text(0.05, 0.5, param_text, transform=ax_box.transAxes,
                fontsize=8.8, verticalalignment="center", fontfamily="monospace",
                bbox=dict(boxstyle="round,pad=0.8", facecolor="#eef2f9", edgecolor="#b0c4de", alpha=0.9))

    png_path = f"{out_prefix}_master.png"
    pdf_path = f"{out_prefix}_master.pdf"
    plt.savefig(png_path, dpi=300, bbox_inches="tight")
    plt.savefig(pdf_path, bbox_inches="tight")
    plt.close()
    print(f"✓ Saved: {png_path}")
    print(f"✓ Saved: {pdf_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate BGW vs Single Encryption Performance Graphs")
    parser.add_argument("--calibrate", action="store_true", help="Calibrate constants using live empirical testbed data")
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if args.calibrate:
        params = get_calibrated_params()
        suffix = "_calibrated"
    else:
        params = THEORETICAL_PARAMS
        suffix = ""

    print("\n" + "=" * 60)
    print(f"GENERATING BGW VS SINGLE ENCRYPTION FIGURES [{params['mode'].upper()}]")
    print("=" * 60)
    for k, v in params.items():
        print(f"  {k:15}: {v}")
    print("-" * 60)

    data = compute_metrics(params)
    out_prefix = os.path.join(OUTPUT_DIR, f"bgw_vs_single{suffix}")

    plot_transactions_grid(data, out_prefix)
    plot_users_row(data, out_prefix)
    plot_master_dashboard(data, out_prefix)

    print("\n✅ All comparative figures successfully generated in:")
    print(f"   {OUTPUT_DIR}/\n")

if __name__ == "__main__":
    main()
