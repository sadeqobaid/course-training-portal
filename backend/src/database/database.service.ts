// Script name: database.service.ts
// Original location: backend/src/database/database.service.ts
// What this script is: A NestJS provider that manages a PostgreSQL connection pool and exposes query and transaction helpers.
// What it is used for: To perform database queries, return typed rows, and run transactional work using a pooled client.
// Programming language: TypeScript
// Inputs: SQL text and optional parameter arrays; environment variable env.databaseUrl for connection string.
// Outputs: Typed query results returned in-memory to the calling code (rows arrays or single row) and transactional results.
// Where output is saved or sent: Other: in-memory return to caller (service consumers).
// Technologies and services used or interacted with: NestJS (Injectable, lifecycle hooks), node-postgres (pg Pool/PoolClient), PostgreSQL, local config env.
// Downstream scripts/files/processes that consume the output: Any NestJS controllers, services, or repositories that inject DatabaseService to run queries; database migration or seed scripts may also use it.
// Risks and safe change note: Modifying pool configuration, connection handling, or transaction flow can cause resource leaks, uncommitted transactions, or downtime. Ensure proper testing when changing connectionString handling, pool sizing, or error/rollback logic. Keep lifecycle hooks intact to avoid leaking connections.
// created by: Sadeq Obaid

// Import NestJS decorators and lifecycle interfaces used to mark the provider and handle init/teardown.
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Import pg types and classes for connection pooling, client usage, and typed query row results.
import { Pool, PoolClient, QueryResultRow } from 'pg';
// Import environment configuration which provides the database URL used to create the pool.
import { env } from '../config/env.js';

// Mark the class as a NestJS injectable provider so it can be injected into other services/controllers.
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  // Create a private readonly PostgreSQL connection pool using the connection string read from env.databaseUrl.
  private readonly pool = new Pool({ connectionString: env.databaseUrl });

  // Lifecycle hook called by NestJS when the module is initialized; used to verify the connection is usable.
  async onModuleInit(): Promise<void> {
    // Execute a lightweight query ('SELECT 1') to ensure the pool can obtain a working connection on startup.
    await this.pool.query('SELECT 1');
  }

  // Lifecycle hook called by NestJS when the module is being destroyed; used to cleanly shutdown the pool.
  async onModuleDestroy(): Promise<void> {
    // End the pool, closing all clients and releasing resources before application shutdown.
    await this.pool.end();
  }

  // Generic helper to execute a query and return an array of typed result rows.
  async query<T extends QueryResultRow>(
    // The SQL query text to execute.
    text: string,
    // Optional parameter values for parameterized queries; defaults to an empty array when omitted.
    values: readonly unknown[] = [],
  ): Promise<T[]> {
    // Execute the query on the pool with the provided SQL and values, applying the generic type for result rows.
    const result = await this.pool.query<T>(text, values as unknown[]);
    // Return the rows array produced by the query result to the caller.
    return result.rows;
  }

  // Convenience helper to fetch a single row (first row) or undefined when no rows are returned.
  async one<T extends QueryResultRow>(
    // The SQL query text to execute.
    text: string,
    // Optional parameter values for parameterized queries; defaults to an empty array when omitted.
    values: readonly unknown[] = [],
  ): Promise<T | undefined> {
    // Reuse the query helper to execute the SQL and obtain all rows.
    const rows = await this.query<T>(text, values);
    // Return the first row from the result array (or undefined if the array is empty).
    return rows[0];
  }

  // Run a unit of work inside a database transaction using a pooled client; the provided work function receives the client.
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    // Acquire a dedicated client from the pool for the duration of this transaction.
    const client = await this.pool.connect();
    try {
      // Begin a transaction on the acquired client.
      await client.query('BEGIN');
      // Execute the provided work function, passing the client so callers can run queries within the same transaction.
      const result = await work(client);
      // Commit the transaction if the work completed successfully.
      await client.query('COMMIT');
      // Return the value produced by the work function back to the caller.
      return result;
    } catch (error) {
      // On any error, roll back the transaction to revert partial changes.
      await client.query('ROLLBACK');
      // Rethrow the original error so the caller can handle it.
      throw error;
    } finally {
      // Always release the client back to the pool so it can be reused, regardless of success or failure.
      client.release();
    }
  }
}
