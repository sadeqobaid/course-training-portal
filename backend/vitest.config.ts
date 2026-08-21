// Script name: vitest.config.ts
// Original location: backend/vitest.config.ts
// What this script is: Vitest configuration file exporting default test configuration using defineConfig
// What it is used for: Configures Vitest test runner options such as environment, globals, and test file patterns
// Programming language: TypeScript
// Inputs: Imported defineConfig from 'vitest/config' and project filesystem test files matched by include patterns
// Outputs: A configuration object exported as the module default consumed by Vitest runner
// Where output is saved or sent: None
// Technologies and services used or interacted with: Vitest test runner, Node.js environment, the filesystem (test files)
// Downstream scripts/files/processes that consume the output: Vitest CLI/tasks, test runner integrations, CI pipelines
// Risks and safe change note: Changing patterns or environment may alter which tests run and their runtime; update cautiously and validate in CI
// created by: Sadeq Obaid

// Import the defineConfig helper from the Vitest configuration module to build a typed config object used below.
import { defineConfig } from 'vitest/config';

// Export the default configuration for Vitest by invoking defineConfig with the configuration object.
export default defineConfig({
  // Start of the 'test' configuration object that groups test-runner specific settings.
  test: {
    // Enable global helpers (like describe, it) so tests can use them without explicit imports.
    globals: true,
    // Specify that tests should run in a Node.js environment rather than a browser-like environment.
    environment: 'node',
    // Begin the array of glob patterns that determine which test files are included by Vitest.
    include: [
      // Include all unit test files ending with .test.ts under the tests/unit directory and its subdirectories.
      'tests/unit/**/*.test.ts',
      // Include all integration test files ending with .test.ts under the tests/integration directory and its subdirectories.
      'tests/integration/**/*.test.ts',
      // Include all API test files ending with .test.ts under the tests/api directory and its subdirectories.
      'tests/api/**/*.test.ts',
    ],
  },
});
