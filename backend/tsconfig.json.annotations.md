---
Script/configuration name: tsconfig.json
Original location: backend/tsconfig.json
What it is and what it is used for: TypeScript compiler configuration file that controls how the TypeScript compiler (tsc) compiles the project's .ts files to JavaScript, what language features are targeted, which checks are enforced, and where outputs are written.
Programming/data format: JSON
Inputs: TypeScript source files matched by the "include" globs (src/**/*.ts, prisma/**/*.ts, tests/**/*.ts); also ambient type declaration files and imported modules.
Outputs: Compiled JavaScript files, source maps (.map), and TypeScript declaration files (.d.ts) as configured (outDir: dist).
Where output/configuration is saved or consumed: The compiled outputs are saved under the configured outDir ("dist") and consumed by Node.js at runtime, packaging/build steps (Docker, bundlers), test runners, and deployment pipelines. The tsconfig.json itself is read by the TypeScript compiler (tsc), IDEs (VSCode), linters, and build tools.
Technologies and services that use it: TypeScript compiler (tsc), Node.js (nodenext ESM behavior), bundlers or packagers, test runners, IDEs/editor integrations, CI/CD pipelines.
Downstream files/processes: dist/*.js (runtime), dist/*.d.ts (type consumers), source maps for debugging, server startup scripts, deployment artifacts, test runs, and any other build or packaging steps that consume the compiled output.
created by: Sadeq Obaid

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "ES2023",
    "declaration": true,
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "prisma/**/*.ts", "tests/**/*.ts"]
}
```

Line-by-line explanation (every non-empty JSON line in order)

| Line (original JSON line) | Explanation |
|---|---|
| `{` | Opens the top-level JSON object that contains the tsconfig settings. |
| `  "compilerOptions": {` | Starts the "compilerOptions" object: the main section where TypeScript compilation behavior and flags are declared. |
| `    "module": "nodenext",` | Sets the module system output to "nodenext", which aligns TypeScript's module emit with Node.js' ESM/Node resolution semantics (suitable for Node.js ESM + package exports and "type": "module"). |
| `    "moduleResolution": "nodenext",` | Tells the compiler to resolve module imports using Node's ESM-aware resolution algorithm ("nodenext"), matching how Node resolves packages and file extensions in ESM mode. |
| `    "target": "ES2023",` | Sets the ECMAScript language level for emitted JavaScript to ES2023; determines available builtins and syntax emitted. |
| `    "declaration": true,` | Instructs TypeScript to generate .d.ts declaration files alongside compiled JS to expose types to consumers. |
| `    "sourceMap": true,` | Instructs TypeScript to emit source maps (.map files) to enable debugging original TypeScript code in runtimes and debuggers. |
| `    "emitDecoratorMetadata": true,` | Emits design-time type metadata for decorated declarations (works with reflect-metadata); used by some DI frameworks and decorator-based libraries. |
| `    "experimentalDecorators": true,` | Enables parsing and transform of the experimental decorator syntax (required when using decorators). |
| `    "allowSyntheticDefaultImports": true,` | Allows default-import syntax from modules that don’t have an explicit default export (compile-time feature that eases interop with CommonJS/ESM). |
| `    "strict": true,` | Enables all strict type-checking options (a superset toggle that turns on several flags to make type checking more robust). |
| `    "noImplicitAny": true,` | Disallows expressions and declarations implicitly inferred as 'any'; forces explicit typing in those cases. |
| `    "strictNullChecks": true,` | Treats null and undefined as distinct types that are not assignable to other types unless explicitly allowed, preventing many runtime null errors. |
| `    "noUnusedLocals": true,` | Causes a compilation error when local variables are declared but never used (helps keep code clean). |
| `    "noUnusedParameters": true,` | Causes a compilation error when function parameters are declared but never used (helps detect dead API surface or mistakes). |
| `    "skipLibCheck": true,` | Skips type checking of declaration files (.d.ts) from dependencies to speed up compilation and avoid issues in third-party typings. |
| `    "outDir": "dist"` | Sets the directory where compiled output (JS, .d.ts, .map) will be written — here "dist". |
| `  },` | Closes the "compilerOptions" object. |
| `  "include": ["src/**/*.ts", "prisma/**/*.ts", "tests/**/*.ts"]` | Lists glob patterns for files to include in the compilation context: all .ts files under src, prisma, and tests directories. These determine which files tsc processes. |
| `}` | Closes the top-level JSON object. |
