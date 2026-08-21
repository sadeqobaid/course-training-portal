---
Script/configuration name: tsconfig.app.json
Original location: frontend/tsconfig.app.json
What it is and what it is used for:
- A TypeScript project configuration file that declares compiler options and included source files for the frontend application. It is used by the TypeScript compiler (tsc), editors/IDEs (via tsserver), and bundlers/build tools to control type-checking and module resolution behavior for the frontend source code.

Programming/data format: JSON

Inputs:
- TypeScript/JavaScript source files located under the "src" directory of the frontend project.
- Declaration files provided by the runtime and libraries referenced via the "lib" option.

Outputs:
- No JS/TS emit by tsc when used with these options because `"noEmit": true`. However, when incremental or build tools use build-info, a tsbuild info file path is specified (`tsBuildInfoFile`), which is written when incremental builds are enabled by the toolchain.
- Type-checking results (errors/warnings) consumed by developer tools and CI.

Where output/configuration is saved or consumed:
- This file is saved at frontend/tsconfig.app.json.
- Consumed by: TypeScript compiler (tsc), tsserver (editor intellisense), bundlers (Vite/Webpack/Rollup), linters and CI processes that run type checks.

Technologies and services that use it:
- TypeScript (tsc)
- IDEs/editors (VS Code via tsserver)
- Bundlers and dev servers (Vite, Webpack, esbuild, Rollup) and their integrations
- React (JSX runtime configuration)
- Node.js runtime for dev tooling
- Linters or CI jobs that perform type checks (e.g., GitHub Actions, CI pipelines)

Downstream files/processes:
- Bundler outputs (the bundler/packager will consume the source and may rely on these settings to resolve modules)
- Editor type-checking and auto-complete (tsserver)
- CI type-check steps (may use this config to run tsc --noEmit)
- Potentially a tsbuild info file at the specified path when incremental builds are enabled by the toolchain

---

Fenced copy of the original JSON (preserved exactly):
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

Line-by-line explanation table (every non-empty JSON line, in order):

| Line | JSON line (exact) | Explanation |
|---:|---|---|
| 1 | { | Opens the root JSON object that contains the tsconfig configuration. |
| 2 |   "compilerOptions": { | Starts the "compilerOptions" object which holds TypeScript compiler settings applied to this project/configuration. |
| 3 |     "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo", | Specifies the path where TypeScript can write build-info metadata for incremental builds (tsbuild info). The path points to node_modules/.tmp/tsconfig.app.tsbuildinfo. Note: writing occurs only when tools enable incremental builds. |
| 4 |     "target": "ES2023", | Sets the JavaScript language version that TypeScript will target when emitting code and for certain type definitions — here ECMAScript 2023 features are assumed. |
| 5 |     "useDefineForClassFields": true, | Enables emission semantics for class fields that match the ECMAScript "define" behavior (aligns compiled output with native class field semantics). |
| 6 |     "lib": ["ES2023", "DOM", "DOM.Iterable"], | Lists the library declaration files included for type information: ES2023 (modern ECMAScript APIs), DOM (browser DOM APIs), and DOM.Iterable (iterable DOM collections). |
| 7 |     "allowJs": false, | Disables including/compiling plain .js files as part of the TypeScript project. Only TypeScript files (and allowed extensions) are considered. |
| 8 |     "skipLibCheck": true, | Skips type checking of declaration (.d.ts) files to speed up the type-checking process at the cost of potentially missing issues inside library declaration files. |
| 9 |     "esModuleInterop": true, | Emits helper code to improve interoperability between CommonJS and ES module imports (enables default import interop for CommonJS modules). |
| 10 |     "allowSyntheticDefaultImports": true, | Allows syntax for default imports from modules that don’t have a default export at the type level; useful for smoother imports of certain CommonJS modules in TS code. |
| 11 |     "strict": true, | Enables TypeScript's strict type-checking options (strict null checks, strict type inference, etc.) to increase type safety across the project. |
| 12 |     "noUnusedLocals": true, | Produces an error when a local variable is declared but never used; helps keep code clean by preventing unused locals. |
| 13 |     "noUnusedParameters": true, | Produces an error when a function parameter is declared but never used; helps catch unnecessary parameters. |
| 14 |     "module": "ESNext", | Sets the module code generation strategy to "ESNext", preserving modern ES module import/export syntax for downstream bundlers or runtimes to handle. |
| 15 |     "moduleResolution": "bundler", | Uses the "bundler" module resolution strategy, which is optimized for modern bundlers and respects package exports/fields and extension resolution patterns used by bundlers. |
| 16 |     "allowImportingTsExtensions": true, | Permits import specifiers that include TypeScript file extensions (e.g., import "./x.ts") — allows literal imports that include .ts/.tsx in the path. |
| 17 |     "verbatimModuleSyntax": true, | Tells the compiler to preserve module syntax as written (do not transform import/export syntax), leaving transformations to downstream tools. |
| 18 |     "moduleDetection": "force", | Forces TypeScript to treat files according to module semantics (affects how TS decides if a file is a script or a module); useful for consistent module behavior. |
| 19 |     "noEmit": true, | Disables emitting compiled output files from tsc. This configuration is typically used when a bundler handles output generation and tsc is used only for type checking. |
| 20 |     "jsx": "react-jsx" | Configures JSX handling to use the new automatic React JSX runtime ("react-jsx"), which imports the runtime automatically and is suitable for React 17+ style transforms. |
| 21 |   }, | Closes the "compilerOptions" object and continues the root object. |
| 22 |   "include": ["src"] | Declares the set of file paths to include in the project: all files under the "src" directory are included for type-checking and project scope. |
| 23 | } | Closes the root JSON object, ending the configuration file. |

created by: Sadeq Obaid
