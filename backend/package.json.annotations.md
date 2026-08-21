---
Script/configuration name: package.json  
Original location: backend/package.json  
What it is and what it is used for: A Node.js/NPM package manifest that declares project identity, versioning, installable dependencies, developer tooling and runnable scripts for the backend of the "course-training-portal-api". Used by npm/yarn/pnpm and tooling to install packages and run commands (build, start, test, migrations, etc.).  
Programming/data format: JSON  
Inputs: Human-maintained metadata (name, version, scripts, dependency versions); environment variables and runtime inputs consumed by the scripts referenced here.  
Outputs: No direct file output by this manifest itself — it controls installed node_modules, built artifacts (e.g., dist/), and runtime behavior when scripts are invoked.  
Where output/configuration is saved or consumed: Consumed by npm/yarn/pnpm, Node.js runtime, TypeScript compiler, NestJS CLI, Vitest, test scripts, and the project's build and CI processes. Installed packages are saved into node_modules; built files (e.g., dist/) are produced by build scripts.  
Technologies and services that use it: npm/pnpm/yarn, Node.js, TypeScript (tsc), NestJS, Vitest, tsx, PostgreSQL client (pg), nodemailer, Argon2, and any CI/CD system that runs project scripts.  
Downstream files/processes: node_modules/ installation; build output (dist/main.js); database migrations and seeds (scripts/); automation worker (src/automation/worker.ts); test runners and test artifacts; CI pipelines that call these scripts.  
created by: Sadeq Obaid
---

```json
{
  "name": "course-training-portal-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "worker": "tsx src/automation/worker.ts",
    "worker:dev": "tsx watch src/automation/worker.ts",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:seed": "tsx scripts/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:live-api": "node tests/api/live-http-contract.mjs",
    "test:live-e2e": "node tests/e2e/live-runbook.mjs",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "11.2.1",
    "@nestjs/core": "11.2.1",
    "@nestjs/jwt": "11.0.1",
    "@nestjs/platform-express": "11.2.1",
    "@nestjs/throttler": "6.4.0",
    "argon2": "0.44.0",
    "class-transformer": "0.5.1",
    "class-validator": "0.14.2",
    "dotenv": "17.2.2",
    "helmet": "8.1.0",
    "node-cron": "4.2.1",
    "nodemailer": "7.0.6",
    "pg": "8.16.3",
    "reflect-metadata": "0.2.2",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@nestjs/cli": "11.0.11",
    "@nestjs/schematics": "11.0.7",
    "@nestjs/testing": "11.2.1",
    "@types/express": "5.0.3",
    "@types/node": "24.7.0",
    "@types/node-cron": "3.0.11",
    "@types/nodemailer": "6.4.17",
    "@types/pg": "8.15.5",
    "@types/supertest": "6.0.3",
    "supertest": "7.1.4",
    "tsx": "4.19.4",
    "typescript": "5.9.3",
    "vitest": "2.1.9"
  }
}
```

Line-by-line explanation (every non-empty JSON line, in order)

| Line | JSON (exact) | Explanation |
|---:|---|---|
| 1 | { | Opening JSON object; start of the package.json top-level object. |
| 2 |   "name": "course-training-portal-api", | Declares the package name used to identify the project; useful for logs, scripts and package managers. Not necessarily published. |
| 3 |   "version": "1.0.0", | Semantic version of the project. Used for release/version tracking and by package managers when publishing or referencing versions. |
| 4 |   "private": true, | Marks the package as private to prevent accidental publishing to the public npm registry (npm will refuse to publish when true). |
| 5 |   "scripts": { | Begins the "scripts" object, which maps script names to shell commands that can be run via npm/yarn/pnpm (e.g., npm run build). |
| 6 |     "build": "nest build", | Script "build" runs the NestJS build command; typically compiles TypeScript sources into JavaScript under dist/. |
| 7 |     "start": "node dist/main.js", | Script "start" runs the built Node.js entrypoint produced by the build step (dist/main.js). |
| 8 |     "start:dev": "nest start --watch", | Script "start:dev" runs NestJS in watch mode for development, automatically restarting on file changes. |
| 9 |     "worker": "tsx src/automation/worker.ts", | Script "worker" runs a TypeScript worker script directly using tsx (runtime that executes TS without precompilation) located at src/automation/worker.ts. |
| 10 |     "worker:dev": "tsx watch src/automation/worker.ts", | Script "worker:dev" runs the worker in watch mode via tsx, restarting the worker when source changes. |
| 11 |     "db:migrate": "tsx scripts/migrate.ts", | Script to run database migrations via a TypeScript script (scripts/migrate.ts) executed with tsx. Responsible for schema changes. |
| 12 |     "db:seed": "tsx scripts/seed.ts", | Script to seed the database (insert initial or test data) by running scripts/seed.ts with tsx. |
| 13 |     "test": "vitest run", | Script "test" runs the test suite once using Vitest in run mode (non-watch). |
| 14 |     "test:watch": "vitest", | Script "test:watch" runs Vitest in interactive/watch mode for TDD-style development. |
| 15 |     "test:e2e": "vitest run --config vitest.e2e.config.ts", | Runs end-to-end tests with Vitest using a specific E2E configuration file (vitest.e2e.config.ts). |
| 16 |     "test:live-api": "node tests/api/live-http-contract.mjs", | Runs a Node.js test script that likely performs live HTTP contract tests against a running API (tests/api/live-http-contract.mjs). |
| 17 |     "test:live-e2e": "node tests/e2e/live-runbook.mjs", | Runs a Node.js script to execute live end-to-end runbook tests (tests/e2e/live-runbook.mjs). |
| 18 |     "typecheck": "tsc --noEmit" | Runs the TypeScript compiler in type-check-only mode (noEmit prevents JS output) to validate types. |
| 19 |   }, | Closing the "scripts" object. |
| 20 |  "dependencies": { | Begins the "dependencies" object; runtime dependencies required for the application to run in production. |
| 21 |    "@nestjs/common": "11.2.1", | NestJS common utilities package version 11.2.1 — core decorators, helpers, and common modules. |
| 22 |    "@nestjs/core": "11.2.1", | NestJS core runtime package providing the application bootstrapping and DI container. |
| 23 |    "@nestjs/jwt": "11.0.1", | NestJS integration for JWT handling (signing/verifying tokens) used for authentication. |
| 24 |    "@nestjs/platform-express": "11.2.1", | NestJS platform adapter for Express — enables Nest to run on Express-based HTTP server. |
| 25 |    "@nestjs/throttler": "6.4.0", | NestJS throttling/rate-limiting module (to limit requests per time window). |
| 26 |    "argon2": "0.44.0", | Argon2 password hashing library; used for secure password hashing and verification. |
| 27 |    "class-transformer": "0.5.1", | Library that transforms plain objects to class instances and vice versa; commonly used with Nest DTOs. |
| 28 |    "class-validator": "0.14.2", | Validation decorators and utilities to validate DTOs and input payloads in Nest controllers. |
| 29 |    "dotenv": "17.2.2", | Loads environment variables from a .env file into process.env; used for configuration. |
| 30 |    "helmet": "8.1.0", | HTTP security middleware that sets various security-related HTTP headers. |
| 31 |    "node-cron": "4.2.1", | Cron scheduling library for running scheduled jobs within the Node process. |
| 32 |    "nodemailer": "7.0.6", | Library for sending emails from Node.js (SMTP or other transports). |
| 33 |    "pg": "8.16.3", | PostgreSQL client driver for Node.js — used to connect to Postgres databases. |
| 34 |    "reflect-metadata": "0.2.2", | Polyfill/shim for the Reflect metadata API; required by TypeScript decorators (used by Nest). |
| 35 |    "rxjs": "7.8.2" | Reactive Extensions library used by Nest and for reactive programming patterns. |
| 36 |  }, | Closing the "dependencies" object. |
| 37 |  "devDependencies": { | Begins the "devDependencies" object; tooling and libraries required for development/testing but not for production runtime. |
| 38 |    "@nestjs/cli": "11.0.11", | NestJS CLI tool used for generating code, building, and developer tasks. |
| 39 |    "@nestjs/schematics": "11.0.7", | Schematics for Nest code generation and project scaffolding. |
| 40 |    "@nestjs/testing": "11.2.1", | Nest testing utilities for unit/integration tests (mocks, test module builder). |
| 41 |    "@types/express": "5.0.3", | TypeScript type definitions for Express (useful for compilation & editor tooling). |
| 42 |    "@types/node": "24.7.0", | TypeScript definitions for Node.js built-in APIs. |
| 43 |    "@types/node-cron": "3.0.11", | Type definitions for node-cron. |
| 44 |    "@types/nodemailer": "6.4.17", | Type definitions for nodemailer. |
| 45 |    "@types/pg": "8.15.5", | Type definitions for the pg (Postgres) library. |
| 46 |    "@types/supertest": "6.0.3", | Type definitions for SuperTest (HTTP assertions in tests). |
| 47 |    "supertest": "7.1.4", | Library for HTTP assertions used in integration tests (makes requests against running server). |
| 48 |    "tsx": "4.19.4", | Runtime that allows executing TypeScript/TSX files directly (used throughout scripts for ad hoc TS execution). |
| 49 |    "typescript": "5.9.3", | TypeScript language compiler used for typechecking and compilation in builds. |
| 50 |    "vitest": "2.1.9" | Test runner (Vitest) used for unit and other automated tests. |
| 51 |  } | Closing the "devDependencies" object. |
| 52 | } | Closing the top-level JSON object; end of package.json. |

Notes and cross-references
- Scripts listed under "scripts" are invoked by package manager commands (e.g., npm run build, npm run db:migrate). They reference files and outputs:
  - build → produces dist/main.js which is executed by "start".
  - db:migrate and db:seed → reference TypeScript scripts in scripts/; these will interact with the database (Postgres via pg).
  - worker and worker:dev → reference a worker entry (src/automation/worker.ts) which is likely run as a background job or separate process.
  - test:e2e and other test scripts reference specific test configuration files and scripts under tests/ and vitest configs.
- Dependencies vs devDependencies: packages required at runtime (dependencies) must be present in production deployments; devDependencies are used during development/CI/test and typically not installed in production when using --production flags.
- Changing versions in this file affects installations done by npm/pnpm/yarn and may affect reproducibility; lockfiles (package-lock.json or pnpm-lock.yaml) should be used to pin transitive versions.

created by: Sadeq Obaid
