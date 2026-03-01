# GEMINI.md - e6nlaq's Lab Context

## Project Overview

**e6nlaq's Lab** is a personal portfolio website and hub for various web tools, primarily focused on mathematics and competitive programming. The project is a monorepo featuring a **Next.js** application and a **Rust-based WebAssembly** module for performance-critical or specialized logic.

### Core Technologies
- **Framework:** Next.js (App Router) + React 19 (experimental features like `--turbopack` and `react-dom/server` usage)
- **Language:** TypeScript (Primary), Rust (WASM)
- **Styling:** Tailwind CSS v4, Motion (framer-motion) for animations
- **UI Components:** Radix UI and shadcn/ui (customized)
- **API Engine:** Elysia is used for some API routes (e.g., `src/app/teapot/route.ts`)
- **WebAssembly:** Rust (`wasm-bindgen`) with competitive programming libraries (`ac-library-rs`)
- **Package Manager:** Bun
- **Tooling:**
  - **Biome:** Used for linting, formatting, and import organization.
  - **Husky & Lint-staged:** Ensures commit quality.
  - **Commitlint:** Enforces conventional commits.

---

## Building and Running

### Prerequisites
- **Bun:** The primary package manager and runtime.
- **Rust/Cargo:** Required to build the WASM module.
- **wasm-pack:** Tool for building Rust-generated WebAssembly.

### Key Commands
- `bun dev`: Runs the development server with Turbopack.
- `bun build`: Builds the production-ready application.
- `bun format`: Runs Biome to check and fix formatting/linting issues in `src`.
- `bun wasm`: Builds the Rust WASM module and prepares it for use in the JS environment.
- `bun start`: Runs the built production application.

---

## Development Conventions

### Coding Style
- **Formatting:** Biome is strictly enforced.
  - **Indentation:** 4 spaces for JavaScript and TypeScript files.
  - **Quotes:** Double quotes are used.
  - **Trailing Commas:** ES5 style.
- **CSS:** Tailwind CSS v4 is used with a focus on modern utility-first styling. Custom CSS is located in `src/app/globals.css`.
- **UI Components:** Reusable UI components follow the shadcn/ui pattern and are located in `src/components/ui`. Note that Biome ignores this directory by default to maintain upstream compatibility.

### Architecture & Patterns
- **App Router:** The project uses the Next.js App Router for layouts, pages, and API routes.
- **Tool Organization:** Tools are organized under `src/app/tools/`. Each tool typically has its own directory. Metadata for tools is centralized in `src/text/meta.ts` and `src/types/meta.ts`.
- **WASM Integration:** Rust logic resides in `wasm/src/`. It is compiled to `wasm/pkg/` and consumed as a local workspace package.
- **API Routes:** API routes are handled in `src/app/**/route.ts`. Interestingly, some use **Elysia** for a lightweight, performant API experience within Next.js.
- **State & Theme:** Uses `next-themes` for dark/light mode and custom hooks (e.g., `useConfirm`) for common UI interactions.

### Metadata & SEO
- A custom utility `convertMetadata` in `src/lib/metadata.ts` is used to generate SEO metadata from tool-specific configurations.

---

## Project Structure (Key Paths)
- `src/app/`: Next.js pages, layouts, and API routes.
- `src/components/`: Shared React components.
- `src/lib/`: Shared utilities and helper functions.
- `src/font/`: Local fonts (e.g., LINE Seed JP).
- `wasm/`: Rust project for WebAssembly module.
- `public/`: Static assets (logos, favicons).
- `biome.json`: Linting and formatting configuration.
- `next.config.ts`: Next.js configuration (configured with SVGR and potentially WASM loading support).
