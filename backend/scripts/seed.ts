// Script name: seed.ts
// Original location: backend/scripts/seed.ts
// What this script is: A small database seeding script that creates local user accounts with predefined roles.
// What it is used for: To populate the development/test database with default accounts and a known password for local testing.
// Programming language: TypeScript
// Inputs: Environment variable DATABASE_URL; static password literal 'ChangeMe123!' used for seeded accounts.
// Outputs: Inserts rows into the database users table; prints a completion message to the console.
// Where output is saved or sent: database/table (users), console
// Technologies and services used or interacted with: Node.js, PostgreSQL (pg Client), argon2 password hashing, environment loader module.
// Downstream scripts/files/processes that consume the output: Application code that relies on seeded users in the users table; local manual testing and QA processes.
// Risks and safe change note: Changing seeded credentials or roles may break local tests or developer workflows; do not run against production databases; ensure DATABASE_URL points to a dev/test DB before executing.
// created by: Sadeq Obaid

// Import environment loader which sets process.env values as a side effect so DATABASE_URL becomes available.
import '../src/config/load-env.js';
// Import the argon2 library to hash the plain-text seed password securely before storing in the database.
import * as argon2 from 'argon2';
// Import the PostgreSQL client class used to connect to and run queries against the target database.
import { Client } from 'pg';

// Define the main asynchronous entry point for the seeding operation; returns a Promise that resolves to void.
async function main(): Promise<void> {
  // Read the DATABASE_URL environment variable from process.env to know where to connect.
  const databaseUrl = process.env.DATABASE_URL;
  // Validate that DATABASE_URL exists and throw immediately if it is not provided to avoid accidental DB writes.
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  // Hash the literal seed password 'ChangeMe123!' using argon2 and await the resulting hash string for insertion.
  const passwordHash = await argon2.hash('ChangeMe123!');
  // Instantiate a new pg Client configured with the connection string from DATABASE_URL.
  const client = new Client({ connectionString: databaseUrl });
  // Establish a network/database connection before running any queries.
  await client.connect();
  // Begin a try/finally block to ensure the database client is closed regardless of success/failure.
  try {
    // Define an array of local account tuples: [email, fullName, role]. Marked as const for type inference and immutability.
    const localAccounts = [
      // Admin account used for system administration tasks in local/dev environment.
      ['admin@example.test', 'Local System Administrator', 'SYSTEM_ADMIN'],
      // Training admin account used for training-specific administration in local/dev environment.
      ['training.admin@example.test', 'Local Training Administrator', 'TRAINING_ADMIN'],
      // Instructor account used to represent an instructor role in local/dev environment.
      ['instructor@example.test', 'Local Instructor', 'INSTRUCTOR'],
      // Learner account used to represent a learner/standard user role in local/dev environment.
      ['learner@example.test', 'Local Learner', 'LEARNER'],
    ] as const;
    // Iterate over each tuple in localAccounts, destructuring to email, fullName, and role for insertion.
    for (const [email, fullName, role] of localAccounts) {
      // Execute an INSERT query for each account, using parameterized values to avoid SQL injection and
      // ON CONFLICT (email) DO NOTHING to make the script idempotent for repeated runs.
      await client.query(
        // SQL statement to insert a user record with the provided fields; this is a template literal spanning lines.
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        // Provide the parameter values for the prepared statement in the expected order matching $1..$4.
        [email, passwordHash, fullName, role],
      );
    }
    // Log a user-friendly message indicating the seed completed and showing the seeded accounts and password.
    console.log(
      'Seed completed. Local role accounts: admin@example.test, training.admin@example.test, instructor@example.test, learner@example.test / ChangeMe123!',
    );
  } finally {
    // Ensure the database client is closed to free network resources even if an error occurred.
    await client.end();
  }
}

// Invoke the main function and deliberately ignore its returned Promise (top-level fire-and-forget pattern).
void main();
