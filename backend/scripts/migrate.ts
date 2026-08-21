import '../src/config/load-env.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    throw new Error(
      'DATABASE_URL is required. Copy .env.example to .env first.',
    );
  const schemaPath = resolve(scriptDirectory, '../database/001_schema.sql');
  const sql = await readFile(schemaPath, 'utf8');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Database schema migration completed.');
  } finally {
    await client.end();
  }
}

void main();
