// Script name: request-id.middleware.ts
// Original location: backend/src/common/request-id.middleware.ts
// What this script is: Middleware class that ensures each incoming HTTP request has a request identifier
// What it is used for: Assigns or propagates an 'x-request-id' header and attaches a requestId property to the request for tracing/logging
// Programming language: TypeScript
// Inputs: Express Request headers (specifically 'x-request-id') and the incoming HTTP request/response objects provided by NestJS/Express
// Outputs: Adds/sets 'x-request-id' on the Response headers and sets request.requestId property
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS framework, Express types, Node.js crypto.randomUUID
// Downstream scripts/files/processes that consume the output: application request handlers, logging/tracing middleware, external services that inspect 'x-request-id'
// Risks and safe change note: Modifying header key, property name, or UUID generation may break request tracing and logs; make coordinated updates across logging, clients, and monitoring when changing behavior
// created by: Sadeq Obaid

// Import the NestJS Injectable decorator and NestMiddleware interface used to define middleware classes.
import { Injectable, NestMiddleware } from '@nestjs/common';
// Import randomUUID from Node's crypto module to generate a UUID when no request id header is provided.
import { randomUUID } from 'node:crypto';
// Import Express types to type the request, response, and next function parameters for the middleware.
import { NextFunction, Request, Response } from 'express';

// Apply the Injectable decorator so NestJS can manage this middleware via dependency injection.
@Injectable()
 // Declare and export the RequestIdMiddleware class which implements NestMiddleware to be used by NestJS middleware pipeline.
export class RequestIdMiddleware implements NestMiddleware {
  // Define the 'use' method required by NestMiddleware; this is invoked for each incoming request.
  use(
    // The incoming request parameter, extended with an optional 'requestId' property that this middleware will set or propagate.
    request: Request & { requestId?: string },
    // The response parameter used to set headers that will be returned to the client.
    response: Response,
    // The next callback to hand control to the next middleware or route handler in the chain.
    next: NextFunction,
  ): void {
    // Read the 'x-request-id' header from the request; if absent, generate a new UUID and assign it to request.requestId.
    request.requestId = request.header('x-request-id') ?? randomUUID();
    // Ensure the response has the same 'x-request-id' header so downstream services/clients can correlate logs/requests.
    response.setHeader('x-request-id', request.requestId);
    // Call next() to continue processing the request with subsequent middleware or the route handler.
    next();
  }
}
