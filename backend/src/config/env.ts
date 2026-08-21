// Script name: env.ts
// Original location: backend/src/config/env.ts
// What this script is: Loads environment variables, validates them, and exposes a typed configuration object.
// What it is used for: Centralized application configuration for the backend (DB, server port, JWT, SMTP, etc.).
// Programming language: TypeScript
// Inputs: Environment variables (process.env) and './load-env.js' which may populate process.env (e.g., from a .env file).
// Outputs: Exported 'env' object matching the AppEnv type for consumption by other modules.
// Where output is saved or sent: None
// Technologies and services used or interacted with: Node.js runtime, process.env, SMTP settings, potential dotenv loader at './load-env.js'.
// Downstream scripts/files/processes that consume the output: server startup code, database client setup, mailer utilities, API route handlers, background jobs.
// Risks and safe change note: Changing environment keys, defaults, validation, or secrets handling can break runtime behavior or leak credentials; update .env.example and dependent code, and validate in staging before production.
// created by: Sadeq Obaid

// Import a local module that ensures environment variables are loaded into process.env (likely reads .env).
import './load-env.js';

// Export a TypeScript type describing the complete shape and types of the configuration object produced below.
export type AppEnv = {
  // The database connection URL used to initialize the DB client.
  databaseUrl: string;
  // The port number the HTTP API server should listen on.
  port: number;
  // Secret used to sign JWT access tokens.
  jwtAccessSecret: string;
  // Time-to-live for JWT access tokens (e.g., '15m').
  jwtAccessTtl: string;
  // Allowed origin for CORS, used by the server.
  corsOrigin: string;
  // Number of days after which a reminder should be sent.
  reminderAfterDays: number;
  // Minimum number of days between reminder emails to avoid spamming.
  reminderCooldownDays: number;
  // SMTP host for sending emails.
  smtpHost: string;
  // SMTP port for sending emails.
  smtpPort: number;
  // Whether to use secure connection (TLS) for SMTP.
  smtpSecure: boolean;
  // Optional SMTP username for authentication.
  smtpUser?: string;
  // Optional SMTP password for authentication.
  smtpPassword?: string;
  // The email address used in the From header when sending emails.
  smtpFrom: string;
};

// Define a helper that reads a required environment variable and throws a clear error if missing.
function required(name: string): string {
  // Read the raw string value from process.env for the given key.
  const value = process.env[name];
  // If the value is falsy (undefined, empty), throw an error to fail fast during startup.
  if (!value)
    throw new Error(
      // Provide a helpful message that suggests copying .env.example to .env and setting the variable.
      `${name} is required. Copy .env.example to .env and set it.`,
    );
  // Return the non-empty string value for further use.
  return value;
}

// Define a helper that parses a positive integer from an environment variable, with a fallback.
function positiveInteger(name: string, fallback: number): number {
  // Obtain the raw value from process.env or fall back to the provided default, converting to string.
  const raw = process.env[name] ?? String(fallback);
  // Convert the raw string to a Number for validation.
  const value = Number(raw);
  // Validate that the value is an integer >= 1 and throw if not valid.
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${name} must be a positive integer.`);
  // Return the validated numeric value.
  return value;
}

// Read SMTP_USER from environment, trimming whitespace; if empty after trim, use undefined to indicate absence.
const smtpUser = process.env.SMTP_USER?.trim() || undefined;
// Read SMTP_PASSWORD from environment; if undefined, keep as undefined to indicate absence.
const smtpPassword = process.env.SMTP_PASSWORD || undefined;

// Construct and export the configuration object, coercing and validating environment variables as needed.
export const env: AppEnv = {
  // Database URL must be provided; fail fast if missing.
  databaseUrl: required('DATABASE_URL'),
  // API port parsed as a positive integer with a default of 3000.
  port: positiveInteger('API_PORT', 3000),
  // JWT access secret must be provided; required ensures presence.
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  // JWT TTL uses provided env value or defaults to '15m'.
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  // CORS origin uses provided env value or defaults to localhost dev origin.
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Reminder scheduling interval in days, validated as positive integer.
  reminderAfterDays: positiveInteger('REMINDER_AFTER_DAYS', 7),
  // Cooldown between reminders in days, validated as positive integer.
  reminderCooldownDays: positiveInteger('REMINDER_COOLDOWN_DAYS', 7),
  // SMTP host, defaulting to 'mailpit' for local testing if not provided.
  smtpHost: process.env.SMTP_HOST ?? 'mailpit',
  // SMTP port validated as positive integer with default 1025.
  smtpPort: positiveInteger('SMTP_PORT', 1025),
  // SMTP secure flag interpreted as true only when the env string equals 'true'.
  smtpSecure: process.env.SMTP_SECURE === 'true',
  // Optional SMTP username (may be undefined).
  smtpUser,
  // Optional SMTP password (may be undefined).
  smtpPassword,
  // From address for outgoing emails with a safe default for tests.
  smtpFrom: process.env.SMTP_FROM ?? 'training-portal@example.test',

};
