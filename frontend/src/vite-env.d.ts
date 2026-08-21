// Script name: vite-env.d.ts
// Original location: frontend/src/vite-env.d.ts
// What this script is: TypeScript ambient declaration reference that exposes Vite client types to the TypeScript compiler.
// What it is used for: Enables TypeScript and IDE tooling to recognize Vite-specific globals (like import.meta.env, HMR types) used throughout the frontend codebase.
// Programming language: TypeScript
// Inputs: None
// Outputs: None
// Where output is saved or sent: None
// Technologies and services used or interacted with: Vite, TypeScript, browser runtime (development tooling), editor/IDE type systems
// Downstream scripts/files/processes that consume the output: Any TypeScript source files in this frontend project that rely on Vite-provided types or import.meta typings.
// Risks and safe change note: Minimal runtime impact (this file affects only type checking and tooling). Removing or changing these references can break compilation and editor autocompletion. Only update when upgrading Vite or its type definitions and verify project-wide type checks.
// created by: Sadeq Obaid
/// <reference types="vite/client" />
