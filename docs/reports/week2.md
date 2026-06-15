# Week 2: Authentication & Dashboard Foundation

## Objective
Establish a secure, role-based session framework (`useAuth`) and layout architecture for Patient, Doctor, Nurse, and Admin interfaces with real-time audit tables.

## Milestones Achieved

### 1. Unified Authentication Framework
- Created an `AuthContext` and custom `useAuth` hook (`src/hooks/useAuth.jsx`) to handle user login, logout, and localStorage session serialization.
- Implemented credentials validation and role resolving, supporting the four target system roles:
  - **Patient**: Self-access
  - **Doctor**: Cardiology Department
  - **Nurse**: General Ward (newly added and verified)
  - **Admin**: System Administrator

### 2. Login Module
- Designed the `/login` screen with:
  - Email format validation (Regex checks).
  - Credentials length validation.
  - Interactive "Remember Me" toggle and simulated "Forgot Password" toast flows.
  - Custom dropdown for selecting the simulated blockchain role.

### 3. Dashboard Skeleton Layout
- Created `DashboardLayout` combining three crucial UI areas:
  - **Sidebar**: Dynamic sidebar loading role-appropriate navigation paths (with active menu indicators and animations).
  - **Topbar**: User identity badges, notifications bell (with shaking micro-animations), and global theme toggle.
  - **Content Area**: Glassmorphic dashboard container.

### 4. Consensus Access Logs
- Created a live audit log table displaying who accessed which records, their role, their action (Read/Write), and consensus decision status.
- Implemented responsive Tailwind rules to colour-code consensus results:
  - **Granted**: Bright Emerald text with matching indicator dot.
  - **Denied**: Crimson Rose text with a red alert dot.

## Verification & Output
- Wrote unit tests for rendering dashboard summary cards for all roles, including the newly introduced Nurse role.
- Verified test suite passes successfully.
