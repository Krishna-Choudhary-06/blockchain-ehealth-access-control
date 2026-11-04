# Blockchain E-Health Access Control Platform

> Implementation of the research paper:  
> **"An Adaptive Blockchain-Enabled Access Control Framework for Secure and Privacy-Preserving E-Health Data Sharing"**  
> *by Notash, Jamali, Fotohi (2026)*

This platform simulates a decentralized eHealth portal that provides Attribute-Based Access Control (ABAC) on electronic medical records (EMR) using a blockchain ledger (Hyperledger Fabric), local client-side AES ciphers, and decentralized storage index (IPFS).

---

## 🌟 Key Features

*   **Cryptographic User Registration**: Register on the blockchain network and generate unique cryptographic certificate IDs.
*   **Role-Based access control (RBAC)**: Support for four distinct simulated system roles:
    *   **Patient**: Self-access control, upload files, inspect record accesses.
    *   **Doctor**: Request access to patient files, check cardiology record logs.
    *   **Nurse**: Inspect accessible lab sheets and general ward records.
    *   **Admin**: System logs manager, performance graphing dashboard, peer controls.
*   **Secure File Upload Module**: Whitelisted extension validation (`.pdf`, `.png`, `.jpg`, `.jpeg`), client-side AES encryption, and metadata review panels.
*   **Live Blockchain Explorer**: Simulates block mining and transaction ledger updates in real-time (every 3 seconds).
*   **Performance Benchmarking Dashboard**: Graphs latency metrics, throughput under stress, and computational costs with CSV/PNG export features.
*   **Comprehensive Testing Suite**: 17 unit/integration tests running with Vitest and React Testing Library.

---

## 📁 Project Structure

*   [`chaincode/`](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/chaincode/) - Hyperledger Fabric access control smart contracts.
*   [`app/`](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/app/) - Backend gateway API services.
*   [`frontend/`](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/frontend/) - Vite + React SPA styled with Tailwind CSS.
*   [`docs/`](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/) - Architectural documentation, system diagrams, and weekly progress reports:
    *   [System Diagrams Document](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/diagrams/system-diagrams.md)
    *   [Week 1 Report](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/reports/week1.md)
    *   [Week 2 Report](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/reports/week2.md)
    *   [Week 3 Report](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/reports/week3.md)
    *   [Week 4 Report](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/reports/week4.md)
    *   [Week 5 Report](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/reports/week5.md)
    *   [Week 6 Report](file:///c:/Users/EcoGo/Desktop/blockchain-eHealth-access-control/docs/reports/week6.md)

---

## 🚀 Quick Start Guide

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)

### Installation & Run Dev Server
1. Navigate to the frontend workspace:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

To execute the automated test suites compiled with Vitest and React Testing Library:
```bash
cd frontend
npm run test
```

The test suites verify form inputs, role routing, encryption ciphers, IPFS hash generation outputs, and dashboard rendering limits.

---

## 🎓 Academic Info

*   **Lead Developers**: eHealth Blockchain Team
*   **Advisor / Professor**: Mr. Dinesh Kumar
*   **Institution**: NIT JAMSHEDPUR