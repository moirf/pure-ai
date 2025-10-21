# Pure AI – Developer Career Site

This repository will host a personal developer career site built with React + TypeScript (Next.js static export) as described in `docs/Plan.Overview.md`.

## Status
Planning phase. Roadmap defined.

## Roadmap
See: [docs/Plan.Overview.md](docs/Plan.Overview.md)

## High-Level Goals
- Fast, accessible, SEO-friendly static site.
- MDX-driven content (projects, experience, blog).
- Automated GitHub Pages deployment.

## Initial Stack (Planned)
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS for styling & theming
- MDX + gray-matter for content
- GitHub Actions for CI/CD

## Getting Started (to be expanded once scaffold added)
```powershell
# (Planned) install deps after scaffold is created
npm install
npm run dev
```

## Run Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)
- TypeScript installed globally (`npm install -g typescript`) or use npx

### Setup
1. Open a terminal in `e:\Code\AgenticAI\pure-ai`
2. Install dependencies:
   ```bash
   npm install
   ```

### Build & Run

#### Option 1: Compile TypeScript & Run with Node
1. Compile the TypeScript code:
   ```bash
   npx tsc
   ```
   This will generate JavaScript files (e.g., in a `dist` folder, if configured in tsconfig.json).
2. Run the compiled server:
   ```bash
   node dist/server/index.js
   ```

#### Option 2: Run with ts-node (for development)
1. Run the server directly:
   ```bash
   npx ts-node e:\Code\AgenticAI\pure-ai\server\index.ts
   ```

## Frontend
- The static frontend files are in the `scaffold` folder. When the server is running, open your browser and navigate to:
  ```
  http://localhost:3000
  ```
- The browser will load `index.html` and fetch questions from the API.

## Notes
- Ensure your `tsconfig.json` is properly configured to compile both server and scaffold TypeScript files if needed.
- Adjust port or file paths as required.

## License
MIT (see LICENSE)

---
Generated from the roadmap; will evolve as implementation begins.
