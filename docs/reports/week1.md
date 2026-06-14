# Week 1: Project Setup & Global UI Setup

## Objective
Establish a clean, scalable, and responsive React + Vite project base with high-quality CSS architecture and custom global theme contexts.

## Milestones Achieved

### 1. Framework Initialization
- Created a standard React web application scaffold using Vite.
- Configured ESLint rules for developer safety.
- Configured dynamic routing using React Router.

### 2. Styling Foundation (Tailwind CSS Integration)
- Integrated Tailwind CSS v4 using the Vite plugin for efficient compile-time styles.
- Configured custom variables in `index.css` supporting dark mode and HSL tailoring.
- Implemented smooth transition classes across all interactive elements (`transition-colors duration-300`).

### 3. Theme & Accessibility Context
- Created `ThemeContext` under `src/hooks/useTheme.jsx` providing state indicators for `light` and `dark` modes.
- Integrated theme toggles inside the navigation flow.
- Added custom accessibility focus styles (`focus:ring-2 focus:ring-purple-500 focus:outline-none`) to key input fields.

### 4. Layout Architecture
- Designed a unified responsive `MainLayout` wrapping standard pages.
- Created premium glassmorphic navigation components:
  - **Navbar**: Adaptive routing state indicator and light/dark toggle.
  - **Footer**: Legal and system ledger details.

## Verification & Output
- Confirmed successful Vite build step with clean outputs.
- Inspected light-to-dark transitions in web UI.
