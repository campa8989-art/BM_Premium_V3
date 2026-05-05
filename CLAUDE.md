# BM Project V3 - Building Manager Dashboard

BM Premium v2 dashboard for facility management, focused on AI-driven analysis of technical documentation (verbali) and premium visual excellence.

## Project Overview

- **Frontend**: Vite-powered SPA with Vanilla JS, HTML5, and high-end CSS (Glassmorphism, Liquid Glass).
- **Backend**: Node.js Express server (`src/backend/server_verbali.js`) for PDF processing and AI integration.
- **AI Integration**: Gemini Flash for technical analysis and digital twin visualizer.
- **Environment**: Managed through `.env` for API keys and server configuration.

## Critical Rules

### 1. Visual Excellence (Premium Design)
- **Rich Aesthetics**: Harmonious color palettes (Nocturne/Slate), smooth gradients, and glassmorphism.
- **Micro-animations**: Subtle hover effects and interactive transitions are mandatory.
- **Dynamic UI**: Interfaces must feel "alive" and responsive.
- **No Browser Defaults**: Custom typography (Inter/Roboto) and sleek components only.

### 2. Code Organization & Style
- **Modular JS**: Use ESM modules and keep logic separated from UI rendering.
- **Immutability**: Avoid mutating state directly; use functional patterns.
- **Clean Backend**: Centralized error handling and JSDoc for all API endpoints.
- **Naming**: Use descriptive, consistent naming (e.g., `clinical-nocturne` for theme classes).

### 3. ECC Standards
- **TDD First**: Write tests before implementing new features (80% coverage target).
- **Security**: No hardcoded secrets; validate all inputs from the PDF scanner.
- **Context Slop**: Keep files focused (200-500 lines); refactor if they exceed 800 lines.

## Available Commands

### Development
- `npm run dev`: Start both Vite (port 3000) and Backend server.
- `npm run dev:vite`: Start only the frontend dashboard.
- `npm run dev:verbali`: Start only the technical analysis server.

### Build & Testing
- `npm run build`: Generate production bundle.
- `npm run test`: Run the (to be implemented) test suite.

## ECC Workflows (Slash Commands)
- `/plan`: Create detailed implementation plans before coding.
- `/code-review`: Perform deep quality and security audits.
- `/build-fix`: Incrementally resolve build or logic errors.
- `/harness-audit`: Check project alignment with AI-first standards.

## Project Structure
```
/
├── .agent/              # ECC Antigravity configuration
├── src/
│   ├── frontend/        # HTML, CSS, and UI logic
│   └── backend/         # Express server and AI connectors
├── tools/               # External tools (including ECC repo)
├── data/                # Local data storage and PDF samples
└── package.json         # Node.js dependencies and scripts
```
