import '../src/config/load-env.js';
import * as argon2 from 'argon2';
import { Client } from 'pg';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const passwordHash = await argon2.hash('ChangeMe123!');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const localAccounts = [
      ['admin@example.test', 'Local System Administrator', 'SYSTEM_ADMIN'],
      ['training.admin@example.test', 'Local Training Administrator', 'TRAINING_ADMIN'],
      ['instructor@example.test', 'Local Instructor', 'INSTRUCTOR'],
      ['learner@example.test', 'Local Learner', 'LEARNER'],
    ] as const;
    for (const [email, fullName, role] of localAccounts) {
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [email, passwordHash, fullName, role],
      );
    }
    console.log(
      'Seed completed. Local role accounts: admin@example.test, training.admin@example.test, instructor@example.test, learner@example.test / ChangeMe123!',
    );
  } finally {
    await client.end();
  }
}

void main();
