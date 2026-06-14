# Week 4: Blockchain Explorer & Automated Testing Setup

## Objective
Establish a live blockchain network viewer, transaction feed simulation, and comprehensive frontend testing environment with unit and integration tests.

## Milestones Achieved

### 1. Blockchain Explorer
- Registered the `/explorer` path in `App.jsx` and added it to all role sidebar configurations.
- Designed tables for:
  - **Latest Blocks**: Block ID, block hash, transaction counts, and timestamps.
  - **Latest Transactions**: Transaction ID, sender, recipient, action type, and status.
- Designed a live timeline Activity Feed capturing node operations (e.g., Doctors accessing files, access blocks denied, upload transactions).

### 2. Real-Time Network Simulation
- Set up a background `setInterval` loop refreshing every 3 seconds to emulate active block mining and network transactions.
- Synchronized states dynamically between the dashboard logs and the explorer tables.

### 3. Testing Architecture
- Installed Vitest, React Testing Library, and JSDOM to provide standard DOM testing capabilities.
- Created `setupTests.js` configuration files mapping matches and cleanups.
- Setup file mapping rules to support Vite React's strict JSX parser (using `.test.jsx` extensions to compile code cleanly).

### 4. Code Coverage & Verification
- Designed test suites verifying major layout flows:
  - `registration.test.jsx`: Inputs validation, loading triggers, receipts presentation.
  - `login.test.jsx`: Credentials, error states, and session redirections.
  - `upload.test.jsx`: File type restrictions, size alerts, progress, and IPFS receipt cards.
  - `dashboard.test.jsx`: Dynamic metric counts rendering across roles.
  - `performance.test.jsx`: Control panels and literature grids.

## Verification & Output
- Confirmed that all 5 test files containing 17 independent unit assertions compile and pass successfully.
