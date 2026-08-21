// Script name: vitest.e2e.config.ts
// Original location: backend/vitest.e2e.config.ts
// What this script is: Vitest configuration file that exports the configuration object for end-to-end tests.
// What it is used for: Configures Vitest test runner behavior, environment, and which E2E test files to run.
// Programming language: TypeScript
// Inputs: E2E test files matching tests/e2e/**/*.e2e.ts; environment variables and CLI flags provided to Vitest.
// Outputs: Exports a configuration object consumed by Vitest; test run artifacts (logs/reports) produced at runtime by Vitest.
// Where output is saved or sent: console (test runner output); filesystem if reporters are configured; None for this file itself.
// Technologies and services used or interacted with: Vitest, Node.js, TypeScript, test runner/CI systems.
// Downstream scripts/files/processes that consume the output: Vitest CLI/test runner, CI pipelines (e.g., GitHub Actions), reporters that consume test results.
// Risks and safe change note: Changing include patterns, environment, or globals can change which tests run or their runtime context; validate in CI and locally before changing.
// created by: Sadeq Obaid

// Import the defineConfig helper from Vitest to provide type-safe configuration and potential validation.
import { defineConfig } from 'vitest/config';

// Export the default configuration object for Vitest using defineConfig to preserve typings.
export default defineConfig({
  // Top-level 'test' key contains runner options that control how Vitest executes tests.
  test: {
    // Enable global test APIs (e.g., describe, it, expect) so individual test files don't need to import them.
    globals: true,
    // Specify the test environment as Node.js so tests run with Node-like globals and behavior.
    environment: 'node',
    // Define which files Vitest should include as tests: all .e2e.ts files under tests/e2e recursively.
    include: ['tests/e2e/**/*.e2e.ts'],
  },
});

// End of configuration file.
