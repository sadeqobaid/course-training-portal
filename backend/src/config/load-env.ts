// Script name: load-env.ts
// Original location: backend/src/config/load-env.ts
// What this script is: Locates a .env file in the project or parent directory and loads its variables into Node's process.env using dotenv.
// What it is used for: To initialize environment variables for the application at startup from a .env file when present.
// Programming language: TypeScript
// Inputs: Filesystem candidate files (.env in current working directory or parent directory), process.cwd()
// Outputs: Populates Node's process.env with parsed environment variables from the loaded .env file
// Where output is saved or sent: Other: process.env (in-memory)
// Technologies and services used or interacted with: node:fs (existsSync), node:path (resolve), dotenv (config)
// Downstream scripts/files/processes that consume the output: Any application modules or configuration code that read process.env after this script runs (e.g., server bootstrap, config loaders)
// Risks and safe change note: Loading the wrong .env may override critical configuration or leak secrets; changes to candidate order or paths can change runtime behavior. Test changes in non-production environments and avoid committing secrets to source control.
// created by: Sadeq Obaid

// Import existsSync to synchronously check whether a candidate .env file exists on disk.
import { existsSync } from 'node:fs';
// Import resolve to construct absolute, normalized paths from process.cwd() and relative paths.
import { resolve } from 'node:path';
// Import dotenv's config function to load and parse a .env file into process.env when invoked.
import { config } from 'dotenv';

// Define an ordered list of candidate .env file paths to check; priority is top to bottom.
const candidates = [
  // First candidate: .env in the current working directory (project root in most cases).
  resolve(process.cwd(), '.env'),
  // Second candidate: .env in the parent directory; useful for monorepos or services nested under a workspace.
  resolve(process.cwd(), '../.env'),
];

// Iterate over the candidate paths to find the first existing .env file and load it.
for (const candidate of candidates) {
  // Check synchronously whether the candidate path exists on the filesystem.
  if (existsSync(candidate)) {
    // Load the environment variables from the found .env file into process.env using dotenv; this has the side effect of mutating process.env.
    config({ path: candidate });
    // Once a .env file is loaded, stop checking further candidates to avoid overriding with lower-priority files.
    break;
  }
}
