// Script name: vite.config.ts
// Original location: frontend/vite.config.ts
// What this script is: Vite configuration file exporting default configuration for the Vite build/dev tool
// What it is used for: Configures Vite plugins and development server options used when running or building the frontend
// Programming language: TypeScript
// Inputs: Static configuration values in this file; environment variables read by Vite at runtime (not explicit here)
// Outputs: Configuration object consumed by Vite; affects build artifacts and dev server behavior
// Where output is saved or sent: Filesystem: dist (build output when running `vite build`); Browser/HTTP: dev server serves assets over HTTP; Other: None
// Technologies and services used or interacted with: Vite, @vitejs/plugin-react, Node.js/npm, browser (dev server)
// Downstream scripts/files/processes that consume the output: Vite CLI (dev server and build), bundling pipeline, served frontend assets (index.html, JS/CSS), deployment scripts that rely on build output
// Risks and safe change note: Modifying ports, plugin configuration, or server settings can break local development or CI builds; changes should be coordinated and tested across environments before merging
// created by: Sadeq Obaid

// Import the defineConfig helper from the Vite package so the exported configuration is type-aware and validated
import { defineConfig } from 'vite';
// Import the official React plugin factory for Vite which enables JSX handling, Fast Refresh, and related React tooling
import react from '@vitejs/plugin-react';

// Export the configuration as the default export using defineConfig to provide IDE/type support and ensure Vite receives the config object
export default defineConfig({
  // Specify Vite plugins to apply; here we provide an array with the React plugin instance to enable React-specific transforms and HMR
  plugins: [react()],
  // Configure development server settings such as port and behavior when the port is unavailable
  server: {
    // Set the port number the dev server will attempt to listen on; commonly used by developers and tooling
    port: 5173,
    // When true, fail if the requested port is already in use instead of attempting the next available port
    strictPort: true,
  },
});
