// Script name: client.ts
// Original location: frontend/src/api/client.ts
// What this script is: Lightweight HTTP client helper with error wrapper for the frontend
// What it is used for: Centralized fetch wrapper that adds base URL, JSON headers, optional auth, error parsing and a typed return
// Programming language: TypeScript
// Inputs: path (string), optional token (string|null), init (RequestInit)
// Outputs: Parsed JSON response typed as a generic T, or throws HttpError on non-OK responses
// Where output is saved or sent: HTTP/API (requests sent to configured backend), returned to caller as JSON in-memory values
// Technologies and services used or interacted with: fetch API, environment variables via import.meta.env, TypeScript types
// Downstream scripts/files/processes that consume the output: frontend components, services, stores, or any callers of api(...) in the application
// Risks and safe change note: Changing request headers, baseUrl resolution, or error handling can break API integration; modify cautiously and add tests and integration checks
// created by: Sadeq Obaid

// Import the ApiError type from the shared types to type the error body returned by the API.
import type { ApiError } from '../types/api';

// Declare a constant baseUrl that will be resolved from an environment variable or fallback to a local default.
// This line begins the assignment of baseUrl; the value is continued on the next line as part of the same statement.
const baseUrl =
// Read the VITE_API_BASE_URL environment variable at build/runtime via import.meta.env and fall back to 'http://localhost:3000/api/v1' if it's undefined.
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

// Export a custom HttpError class that extends the built-in Error to include HTTP status and the API error body.
export class HttpError extends Error {
  // The constructor declaration begins here and spans multiple lines to list parameters.
  constructor(
    // The HTTP status code returned by the server; stored as a public readonly property.
    public readonly status: number,
    // The parsed API error body conforming to the ApiError type; stored as a public readonly property.
    public readonly body: ApiError,
  ) {
    // Call the Error superclass constructor with a string message derived from the body.message.
    // If body.message is an array, join it with commas; otherwise use it directly.
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
}

// Export an async generic function 'api' that performs an HTTP request and returns a typed response.
export async function api<T>(
  // The path to append to the baseUrl for this request (e.g., '/users').
  path: string,
  // Optional bearer token used to add an Authorization header; may be undefined or null.
  token?: string | null,
  // Optional RequestInit object to customize the fetch call; defaults to an empty object.
  init: RequestInit = {},
): Promise<T> {
  // Perform the fetch call, awaiting the Response; build the URL by concatenating baseUrl and path.
  const response = await fetch(`${baseUrl}${path}`, {
    // Spread any provided init options so the caller can override or extend defaults.
    ...init,
    // Provide default headers and conditionally include Authorization; merge with init.headers afterwards.
    headers: {
      // Ensure the request content type is JSON by default.
      'Content-Type': 'application/json',
      // If a token is provided, include an Authorization header with the Bearer scheme; otherwise include nothing here.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Allow callers to override or add headers by merging init.headers last.
      ...init.headers,
    },
  });
  // If the response status indicates failure (non-2xx), attempt to parse an error body and throw an HttpError.
  if (!response.ok) {
    // Try to parse a JSON body from the response; if parsing fails, provide a fallback object.
    const body = await response
      // Attempt to parse the response as JSON.
      .json()
      // If parsing throws, return an object with statusCode and a fallback message.
      .catch(() => ({
        // Use the numeric response.status as the fallback statusCode in the error body.
        statusCode: response.status,
        // Provide a generic message indicating the response lacked valid JSON.
        message: 'Request failed without a JSON response.',
      }));
    // Throw an instance of HttpError containing the HTTP status and the parsed or fallback error body.
    throw new HttpError(response.status, body as ApiError);
  }
  // On a successful response, return the parsed JSON typed as Promise<T> to the caller.
  return response.json() as Promise<T>;
}
