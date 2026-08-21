// Script name: http-exception.filter.ts
// Original location: backend/src/common/http-exception.filter.ts
// What this script is: An exception filter for NestJS that formats HTTP error responses.
// What it is used for: Catches exceptions thrown in the HTTP context and returns a consistent JSON error payload.
// Programming language: TypeScript
// Inputs: An exception (unknown) and an ArgumentsHost provided by NestJS at runtime.
// Outputs: JSON HTTP responses written to the HTTP client via the Express Response object.
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS, Express, JavaScript Date API.
// Downstream scripts/files/processes that consume the output: Any HTTP clients, logging middleware, front-end callers, or monitoring systems that read the HTTP response.
// Risks and safe change note: Modifying response shape, status mapping, or requestId handling can break clients that expect a specific schema; ensure backward compatibility and add tests when changing behavior.
// created by: Sadeq Obaid

// Import named symbols from the @nestjs/common package required to build an exception filter.
import {
  // ArgumentsHost provides access to platform-specific request/response objects.
  ArgumentsHost,
  // Catch is a decorator that marks this class as an exception filter and optionally narrows exception types.
  Catch,
  // ExceptionFilter is the interface the class implements to satisfy NestJS contract.
  ExceptionFilter,
  // HttpException is the NestJS base class for HTTP-related exceptions; used to detect HTTP errors.
  HttpException,
  // HttpStatus provides numeric HTTP status codes for common statuses.
  HttpStatus,
} from '@nestjs/common';
// Import Express Request and Response types to type the request/response objects accessed from the context.
import { Request, Response } from 'express';

// Apply the Catch decorator with no arguments to indicate this filter should handle all exceptions.
@Catch()
// Export a class implementing ExceptionFilter so NestJS can call its catch method on exceptions.
export class HttpExceptionFilter implements ExceptionFilter {
  // Define the catch method that NestJS will invoke when an exception occurs in HTTP context.
  catch(error: unknown, host: ArgumentsHost): void {
    // Convert the generic ArgumentsHost into an HTTP-specific execution context.
    const context = host.switchToHttp();
    // Obtain the Express Response object from the HTTP context for sending the HTTP response.
    const response = context.getResponse<Response>();
    // Obtain the Express Request object (extended with optional requestId) from the HTTP context for metadata.
    const request = context.getRequest<Request & { requestId?: string }>();
    // Determine whether the thrown error is an instance of NestJS HttpException for conditional handling.
    const isHttp = error instanceof HttpException;
    // Compute the HTTP status code: use the exception's status for HttpException, otherwise default to 500.
    const status = isHttp
      // If it's an HttpException, call getStatus() to retrieve the status code.
      ? error.getStatus()
      // If not an HttpException, use the internal server error status code.
      : HttpStatus.INTERNAL_SERVER_ERROR;
    // Extract the response/detail from the HttpException or provide a generic message for unexpected errors.
    const detail = isHttp ? error.getResponse() : 'Unexpected server error.';
    // Determine a string or array message to send: if detail is a string use it, otherwise try to extract message property.
    const message =
      // If detail is a plain string, use it directly as the message payload.
      typeof detail === 'string'
        // Use the string detail as the message value.
        ? detail
        // Otherwise, attempt to read a message property from the detail object, with fallback text.
        : ((detail as { message?: string | string[] }).message ??
          'Request failed.');
    // Set the HTTP response status and send a JSON object describing the error to the client.
    response.status(status).json({
      // Include the numeric status code under statusCode for client-side handling.
      statusCode: status,
      // Include the resolved message for human-readable error information.
      message,
      // Attach a requestId from the request if present, otherwise mark as 'unknown' for tracing.
      requestId: request.requestId ?? 'unknown',
      // Attach a timestamp in ISO format to indicate when the error response was generated.
      timestamp: new Date().toISOString(),
    });
  }
}
