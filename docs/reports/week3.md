# Week 3: Medical File Upload Module

## Objective
Implement a secure, interactive medical document upload view with strict file-type restrictions, validation, client-side encryption simulation, and IPFS transaction receipt rendering.

## Milestones Achieved

### 1. Upload Interface & Routing
- Registered the `/upload` path in `App.jsx` and added links inside the Patient's sidebar layout.
- Styled a drop-zone panel supporting both drag-and-drop actions and manual file browsers.
- Embedded a sensitivity level select dropdown (Levels L0, L1, L2, L3) with inline explanations.

### 2. Validation System
- Enforced strict whitelist file type verification:
  - **Permitted**: `.pdf`, `.png`, `.jpg`, `.jpeg`
  - **Rejected**: `.exe`, `.bat`, `.apk` (with clear error toast notifications).
- Added size constraints (maximum limit: 10MB) and validation for empty form submissions.

### 3. Simulating Client-Side AES Encryption & IPFS Blocks
- Configured a progress bar that increments smoothly from 0% to 100% during simulated hashing.
- Outputted interactive receipt cards detailing:
  - Computed IPFS hash values (e.g. standard multi-hash strings starting with `Qm`).
  - Generated ledger transaction IDs (`0x` hashes).
  - Current security encryption state.

### 4. Interactive File Preview
- Added inline preview blocks:
  - Live thumbnail views for PNG, JPG, and JPEG files.
  - Formatted file metadata displays for PDF sheets.

## Verification & Output
- Validated error message display on upload failures in test suite (`upload.test.jsx`).
- Verified upload form rendering and state workflows.
