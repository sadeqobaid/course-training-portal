// Script name: migrate.ts
// Original location: backend/scripts/migrate.ts
// What this script is: Node.js/TypeScript script that applies a SQL schema file to a PostgreSQL database.
// What it is used for: Runs the 001_schema.sql migration to create/modify database schema for the application.
// Programming language: TypeScript
// Inputs: Environment variable DATABASE_URL and the SQL file ../database/001_schema.sql relative to the script.
// Outputs: Executes SQL against the target database and logs a completion message to the console.
// Where output is saved or sent: database (Postgres database specified by DATABASE_URL), console
// Technologies and services used or interacted with: Node.js, pg (node-postgres), filesystem (fs/promises), path utilities, import.meta.url, PostgreSQL server
// Downstream scripts/files/processes that consume the output: the application backend and any tests or deployments that rely on the database schema created/updated by this migration
// Risks and safe change note: Running this against the wrong DATABASE_URL can modify or destroy production data; ensure backups and run in controlled environments (CI or staging) before production. Be careful with idempotency of migrations and concurrent runs.
// created by: Sadeq Obaid

// Load environment variables early so process.env.DATABASE_URL and others are populated for following code.
import '../src/config/load-env.js';
// Import readFile to read the SQL migration file asynchronously from the filesystem.
import { readFile } from 'node:fs/promises';
// Import dirname and resolve to compute filesystem paths relative to this script.
import { dirname, resolve } from 'node:path';
// Import fileURLToPath to convert import.meta.url into a filesystem path for dirname.
import { fileURLToPath } from 'node:url';
// Import the Postgres client constructor to connect to and execute queries on the database.
import { Client } from 'pg';

// Compute the directory where this script file resides so relative paths to the database SQL can be resolved.
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

// Declare the main async entrypoint that performs the migration and returns a Promise<void>.
async function main(): Promise<void> {
  // Read the DATABASE_URL environment variable which provides the Postgres connection string.
  const databaseUrl = process.env.DATABASE_URL;
  // If DATABASE_URL is not set, abort early with an informative error to avoid accidental operations.
  if (!databaseUrl)
    // Throw an Error to stop execution and signal the missing configuration requirement.
    throw new Error(
      // The error message instructs the user to create a .env from the example so the required variable exists.
      'DATABASE_URL is required. Copy .env.example to .env first.',
    );
  // Resolve the absolute path to the SQL schema file relative to this script directory.
  const schemaPath = resolve(scriptDirectory, '../database/001_schema.sql');
  // Read the SQL file contents as UTF-8 text; this is the SQL that will be executed against Postgres.
  const sql = await readFile(schemaPath, 'utf8');
  // Instantiate a new Postgres client configured with the connection string from DATABASE_URL.
  const client = new Client({ connectionString: databaseUrl });
  // Open a connection to the Postgres server before executing queries.
  await client.connect();
  // Use try/finally to ensure the client is always closed even if the query fails.
  try {
    // Execute the SQL migration script against the connected database; this may create/alter tables and other objects.
    await client.query(sql);
    // Log a success message to standard output after the migration completes without throwing.
    console.log('Database schema migration completed.');
  } finally {
    // Ensure the database connection is closed to free resources regardless of success or failure.
    await client.end();
  }
}

// Invoke the main function and deliberately ignore its returned Promise value; top-level fire-and-forget.
void main();
