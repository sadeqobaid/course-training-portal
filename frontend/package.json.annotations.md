---
Script/configuration name: package.json
Original location: frontend/package.json
What it is and what it is used for: This is an npm package manifest for a frontend web project. It declares project metadata (name, version), package type, scripts for development/build/test/type-check workflows, runtime dependencies, and development-only dependencies. Tools (npm/yarn/pnpm, Vite, TypeScript, Vitest) read this to install packages and run lifecycle scripts.
Programming/data format: JSON
Inputs: Developer commands (npm/yarn/pnpm scripts), package manager registry (package names/versions) when installing dependencies.
Outputs: Installed node_modules, built bundles (when running build), test results (when running tests), typecheck output. The file itself is read by package managers and build tools but not modified by them in normal operation (except package manager lockfiles).
Where output/configuration is saved or consumed: Consumed by package managers (npm, yarn, pnpm), build tools (Vite, TypeScript), test runner (Vitest). Outputs like build artifacts are typically saved to a dist/build directory (configured elsewhere) and node_modules is created at the repository root or workspace root.
Technologies and services that use it: npm / yarn / pnpm, Node.js, Vite, TypeScript (tsc), React, React DOM, React Router, @tanstack/react-query, Vitest, jsdom. CI services (GitHub Actions, GitLab CI, etc.) commonly run scripts declared here.
Downstream files/processes: package-lock.json / pnpm-lock.yaml / yarn.lock (lockfile produced/updated by package manager), node_modules (installed packages), Vite build output (dist), TypeScript build outputs, test reports; source files (TSX/TS/JS) are compiled and bundled according to these dependencies and scripts.
created by: Sadeq Obaid
---

```json
{
  "name": "course-training-portal-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc -b --pretty false"
  },
  "dependencies": {
    "@tanstack/react-query": "5.90.3",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "react-router-dom": "7.9.6"
  },
  "devDependencies": {
    "@types/node": "24.7.0",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@vitejs/plugin-react": "6.0.5",
    "typescript": "7.0.2",
    "vite": "8.2.1",
    "vitest": "2.1.9",
    "jsdom": "25.0.1"
  }
}
```

Line-by-line explanation (every non-empty JSON line, in order)

| Line | JSON line (exact) | Explanation |
|---:|---|---|
| 1 | `{` | Opening brace: starts the top-level JSON object that contains the package manifest. |
| 2 | `"name": "course-training-portal-web",` | The package name: an identifier for this project. Used by package managers and tooling to refer to the package. |
| 3 | `"version": "1.0.0",` | The semantic version of the project. Useful for publishing and tooling that report or check versions. |
| 4 | `"private": true,` | Marks the package as private. When true, prevents accidental publishing to the public npm registry (npm will refuse to publish). |
| 5 | `"type": "module",` | Declares the package's module type as ES module (ESM). Affects Node.js module resolution: .js files are treated as ESM rather than CommonJS. |
| 6 | `"scripts": {` | Begins the scripts object. Scripts are named command shortcuts run with npm/yarn/pnpm (e.g., npm run dev). |
| 7 | `"dev": "vite",` | Defines the "dev" script: runs the Vite development server. Typical command for local development with hot-reload. |
| 8 | `"build": "tsc -b && vite build",` | Defines the "build" script: runs TypeScript build (-b uses project references) and then runs Vite's production build. Ensures type-related compilation steps and bundling. |
| 9 | `"preview": "vite preview",` | Defines the "preview" script: serves the production build locally using Vite's preview server. Useful to inspect the built output. |
| 10 | `"test": "vitest run",` | Defines the "test" script: runs Vitest in run mode (non-interactive), executing tests and exiting with a status code. |
| 11 | `"typecheck": "tsc -b --pretty false"` | Defines the "typecheck" script: runs TypeScript build for type checking only (project references) with pretty output disabled (useful for CI logs). |
| 12 | `},` | Closes the scripts object. The comma separates this property from the next top-level property. |
| 13 | `"dependencies": {` | Begins the runtime dependencies object. Packages listed here are required at runtime and installed by default for production. |
| 14 | `"@tanstack/react-query": "5.90.3",` | Declares a pinned version of @tanstack/react-query (React data-fetching and caching library) as a runtime dependency. |
| 15 | `"react": "19.2.8",` | Declares the React library version used by the app as a runtime dependency. |
| 16 | `"react-dom": "19.2.8",` | Declares the React DOM package version (renders React to the DOM) as a runtime dependency. |
| 17 | `"react-router-dom": "7.9.6"` | Declares React Router DOM version (client-side routing) as a runtime dependency. This is the last entry in the dependencies object (no trailing comma). |
| 18 | `},` | Closes the dependencies object. The comma separates it from the following devDependencies property. |
| 19 | `"devDependencies": {` | Begins the development-only dependencies object. Packages here are needed for development, build, or testing but not typically required in production runtime. |
| 20 | `"@types/node": "24.7.0",` | Node.js type definitions for TypeScript, useful for typing Node APIs during development. |
| 21 | `"@types/react": "19.2.2",` | TypeScript type definitions for React. |
| 22 | `"@types/react-dom": "19.2.2",` | TypeScript type definitions for react-dom. |
| 23 | `"@vitejs/plugin-react": "6.0.5",` | Vite plugin that adds React fast refresh and JSX/TSX handling for Vite builds. |
| 24 | `"typescript": "7.0.2",` | The TypeScript compiler version used for type-checking and building TypeScript sources. |
| 25 | `"vite": "8.2.1",` | Vite bundler/version used for development server and production builds. |
| 26 | `"vitest": "2.1.9",` | Vitest test runner used to execute unit/integration tests. |
| 27 | `"jsdom": "25.0.1"` | jsdom provides a DOM-like environment for tests run in Node (used by testing setups). This is the last entry in devDependencies (no trailing comma). |
| 28 | `}` | Closes the devDependencies object. |
| 29 | `}` | Closing brace: ends the top-level JSON object (end of package manifest). |

created by: Sadeq Obaid
