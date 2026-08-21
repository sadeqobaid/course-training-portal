// Script name: health.controller.ts
// Original location: backend/src/health/health.controller.ts
// What this script is: A NestJS HTTP controller that exposes a simple health-check endpoint.
// What it is used for: Provides an HTTP GET /health endpoint to verify application liveness and database connectivity.
// Programming language: TypeScript
// Inputs: HTTP GET request to /health
// Outputs: JSON object with 'status' and 'database' fields indicating health and DB reachability
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS framework, a DatabaseService abstraction (likely backed by a DB driver/ORM), Node.js runtime
// Downstream scripts/files/processes that consume the output: Monitoring systems, load balancers, uptime checkers, other services that probe health endpoints
// Risks and safe change note: Modifying response shape or DB-check behavior can break external monitors; keep the DB query minimal and non-blocking; ensure errors are propagated appropriately if DB is unreachable.
// created by: Sadeq Obaid

// Import NestJS decorators 'Controller' and 'Get' which annotate classes/methods to become HTTP controllers and route handlers.
import { Controller, Get } from '@nestjs/common';
// Import the DatabaseService used to perform a lightweight query to confirm DB reachability; injected via constructor.
import { DatabaseService } from '../database/database.service.js';

// Apply the Controller decorator to register this class under the route prefix 'health'.
@Controller('health')
// Define and export the HealthController class which contains the health-check endpoint(s).
export class HealthController {
  // Constructor injects DatabaseService via NestJS dependency injection into a private, readonly field named 'database'.
  constructor(private readonly database: DatabaseService) {}

  // Apply the GET decorator so that HTTP GET requests to '/health' (controller prefix + method) are routed to this method.
  @Get()
  // Define an async method 'check' that returns a Promise resolving to an object with 'status' and 'database' string properties.
  async check(): Promise<{ status: string; database: string }> {
    // Execute a minimal SQL query through the injected DatabaseService to verify the database connection is reachable;
    // awaiting ensures the method will throw if the DB query fails, which signals an unhealthy state.
    await this.database.query('SELECT 1 AS ok');
    // Return a plain object that will be serialized to JSON and sent as the HTTP response body indicating health status.
    return { status: 'ok', database: 'reachable' };
  }
  // End of HealthController class.
}
