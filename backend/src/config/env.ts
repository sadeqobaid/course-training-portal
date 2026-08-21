import './load-env.js';

export type AppEnv = {
  databaseUrl: string;
  port: number;
  jwtAccessSecret: string;
  jwtAccessTtl: string;
  corsOrigin: string;
  reminderAfterDays: number;
  reminderCooldownDays: number;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(
      `${name} is required. Copy .env.example to .env and set it.`,
    );
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name] ?? String(fallback);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${name} must be a positive integer.`);
  return value;
}

const smtpUser = process.env.SMTP_USER?.trim() || undefined;
const smtpPassword = process.env.SMTP_PASSWORD || undefined;

export const env: AppEnv = {
  databaseUrl: required('DATABASE_URL'),
  port: positiveInteger('API_PORT', 3000),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  reminderAfterDays: positiveInteger('REMINDER_AFTER_DAYS', 7),
  reminderCooldownDays: positiveInteger('REMINDER_COOLDOWN_DAYS', 7),
  smtpHost: process.env.SMTP_HOST ?? 'mailpit',
  smtpPort: positiveInteger('SMTP_PORT', 1025),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser,
  smtpPassword,
  smtpFrom: process.env.SMTP_FROM ?? 'training-portal@example.test',

};
