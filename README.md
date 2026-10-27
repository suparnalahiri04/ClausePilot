# ClausePilot — Evidence-First AI Contract Intelligence & Obligation Tracking Platform

ClausePilot is a market-ready, full-stack contract intelligence, risk review, redline comparison, and obligation tracking platform built for startup founders, general counsel, procurement teams, and operations managers.

---

## 1. Visual Identity & "Ombre Magenta & Ivory White" Editorial Design System
- **Main Application Canvas**: Clean, warm Ivory White (`#FAF8F3`) paired with pure white document surfaces (`#FFFFFF`).
- **Ombre Magenta Accents**: Rich `pink-600` to `rose-600` gradients (`bg-gradient-to-r from-pink-600 to-rose-600`) for primary CTAs, active navigation tabs, glowing accents, and status badges.
- **Glassmorphic Surfaces**: Frosted glass cards (`backdrop-blur-md bg-white/80`) with subtle 1px magenta/rose border glows and soft magenta-tinted editorial shadows.
- **Editorial Typography**: `Plus Jakarta Sans` & `Manrope` for the interface, paired with `DM Serif Display` for key editorial headings and `JetBrains Mono` for character offsets and verification telemetry.
- **Custom Hero Banner Integration**: Loads `/banner.png` (`frontend/public/banner.png`) inside rounded, ombre-glow containers on both the Public Landing Page (`/`) and Portfolio Dashboard (`/dashboard`).

---

## 2. Routes & Key Features
- **`/` (Public Landing Page)**: Compelling hero section with `/banner.png` showcase, feature highlights, stakeholder value propositions (Founders, Legal Teams, Procurement), About section, and prominent **Sign In** and **Get Started** CTAs.
- **`/login` & `/signup` (Authentication)**: Full validation, interactive role selectors (`Founder / Executive`, `General Counsel / Legal Ops`, `Procurement Manager`, `Operations Lead`), and persisted workspace authentication state redirecting to `/dashboard`.
- **Sticky Top Horizontal Navigation Bar**: Frosted glassmorphic top header (`backdrop-blur-md bg-white/80`) housing the ClausePilot logo on the left, all 8 primary workspace links in the center, and user profile / quick actions on the right (with responsive mobile/tablet drawer).
- **`/dashboard` (Portfolio Overview)**: KPI summary cards, custom `/banner.png` container, Zero-State **"Load 3 Pre-Verified Sample Contracts"** instant fixture loader, Recharts risk distribution chart, upcoming deadlines timeline, and verification activity feed.
- **`/analyze` (Upload & Analyze)**: Drag-and-drop PDF/DOCX/TXT ingestion (via PyMuPDF & `python-docx`), animated 5-stage analysis & verification progress tracker, and built-in sample contract templates.
- **`/contracts` (Document Library)**: Searchable and filterable Grid/List library with Zero-State sample loader.
- **`/contracts/:id` (Three-Column Document Workspace)**:
  1. Left section outline & commercial metadata card
  2. Center pure-white readable contract preview with click-to-highlight verbatim passages
  3. Right 5-tab intelligence panel (`Summary`, `Clauses`, `Risks`, `Obligations`, `Ask ClausePilot` with graceful missing-evidence fallback)
- **`/risks` (Risk Review Center)**: Categorized by `termination`, `auto-renewal`, `liability`, and `payment` terms with verbatim source excerpts, status updates, toast notifications, and Zero-State sample loader.
- **`/obligations` (Obligations Manager & Timeline)**: Interactive checklist and monthly calendar timeline with one-click completion (`#0F9D91`), custom obligation modal, and Zero-State sample loader.
- **`/compare` (Version Comparison)**: Deterministic word-by-word redline and side-by-side comparison tool with AI-grounded change explanations.
- **`/reports` & `/settings`**: Portfolio audit summaries, one-click JSON/CSV/Markdown exports, Gemini API key configuration, and verification strictness controls.

---

## 3. Running ClausePilot Locally

### One-Command Launcher (Windows PowerShell)
```powershell
.\start-clausepilot.ps1
```

### Or Run Backend & Frontend Separately
1. **Backend API (Port 8000)**:
   ```powershell
   cd backend
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Frontend Dev Server (Port 5173)**:
   ```powershell
   cd frontend
   npm run dev
   ```
