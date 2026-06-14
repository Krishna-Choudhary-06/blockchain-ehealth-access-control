# Week 5: Performance Experiments Dashboard

## Objective
Design and implement an interactive evaluation dashboard simulating transaction latency, system throughput, and overhead analysis under load, with real-time controls and export utilities.

## Milestones Achieved

### 1. Performance Panel Layout
- Registered the `/performance` route in `App.jsx` and added it to the Admin sidebar menu.
- Implemented a clean, grid-based layout displaying experimental graphs alongside controls and tables.

### 2. Custom SVG Graphing Engine
- Designed inline, interactive, responsive SVG graphs to avoid dependency versioning conflicts:
  - **Latency vs. Transactions**: Visualized mean latency curves.
  - **Throughput vs. Input TPS**: Modeled Fabric transaction throughput ceilings.
  - **Communication Overhead**: Byte cost vs. node count.
  - **Computation Overhead**: Execution time vs. cryptographic key size.

### 3. Experiment Control Panel
- Created interactive controls allowing users to:
  - Adjust simulated transaction limits.
  - Start, stop, or reset the experiment simulation.
- Connected control states directly to the SVG line drawings to animate coordinates on active runs.

### 4. Analysis Tables & Export Utilities
- Created tabular grids compiling latency summaries (Average, Max, Min metrics) and throughput details (TPS, Success Rate, Failed count).
- Added literature comparison blocks mapping experimental results against recognized blockchain publications.
- Developed client-side exporters:
  - **CSV Export**: Compiles data rows into CSV content strings for download.
  - **PNG Export**: Serializes the custom SVG layouts to Canvas streams, triggering immediate graphic file downloads.

## Verification & Output
- Added comprehensive unit tests in `performance.test.jsx` confirming render status and simulation states.
- Verified test suite passes successfully.
