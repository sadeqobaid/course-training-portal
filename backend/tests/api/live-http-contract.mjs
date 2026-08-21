// Script name: live-http-contract.mjs
// Original location: backend/tests/api/live-http-contract.mjs
// What this script is: An HTTP integration/contract test script for a live API.
// What it is used for: Verifies basic API health, registration, login, authenticated identity, and access control behavior.
// Programming language: JavaScript (ES module)
// Inputs: Environment variable LIVE_API_BASE_URL (optional); network-accessible API endpoints; test-generated unique email and static test credentials.
// Outputs: JSON summary of HTTP status codes and the test email printed to the console.
// Where output is saved or sent: console
// Technologies and services used or interacted with: fetch HTTP client (global), Node.js environment, API endpoints under /api/v1, process.env for configuration.
// Downstream scripts/files/processes that consume the output: None (console-only output intended for CI logs or human inspection).
// Risks and safe change note: Changing request payloads, expected status codes, or endpoint paths will alter contract expectations; avoid modifying assertions without updating API contract; tests perform user creation on target system — ensure test environment or isolation before running.
// created by: Sadeq Obaid

// Define the base URL for API calls, using LIVE_API_BASE_URL env var if provided, otherwise default to a local URL.
const baseUrl = process.env.LIVE_API_BASE_URL ?? 'http://localhost:3100/api/v1';
// Create a unique suffix for test artifacts based on the current timestamp encoded in base36.
const unique = Date.now().toString(36);

// Define an async helper to perform JSON HTTP requests to the API.
async function jsonRequest(path, options = {}) {
  // Perform the fetch call to the composed URL, merging provided options and ensuring JSON content-type header.
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  // Parse the response body as JSON.
  const body = await response.json();
  // Return both the raw Response object and the parsed JSON body for assertions.
  return { response, body };
}

// Simple assertion helper that throws an Error when the condition is falsy.
function assert(condition, message) {
  // If the assertion fails, throw to abort the test with the provided message.
  if (!condition) throw new Error(message);
}

// Main async test sequence performing health check, register, login, identity, and protected route check.
async function main() {
  // Check API health endpoint and capture response/body.
  const health = await jsonRequest('/health');
  // Assert that health endpoint returns HTTP 200.
  assert(
    health.response.status === 200,
    `Expected health HTTP 200, received ${health.response.status}.`,
  );
  // Assert that health response body indicates both API and database readiness.
  assert(
    health.body.status === 'ok' && health.body.database === 'reachable',
    'Health response body did not confirm API/database readiness.',
  );

  // Construct a unique test email to avoid collisions during registration.
  const email = `http-contract-${unique}@example.test`;
  // Send registration request with POSTed JSON payload containing email, password, and full name.
  const registration = await jsonRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: 'ContractPass123!',
      fullName: 'HTTP Contract Learner',
    }),
  });
  // Assert that registration returned HTTP 201 (created).
  assert(
    registration.response.status === 201,
    `Expected registration HTTP 201, received ${registration.response.status}.`,
  );
  // Assert that the registration response body contains the created user's email matching the request.
  assert(
    registration.body.user.email === email,
    'Registration response did not return the created email.',
  );
  // Assert that a password hash was not exposed in the response object.
  assert(
    !('password_hash' in registration.body.user),
    'Registration response exposed a password hash.',
  );

  // Perform login using the created user's credentials and capture the access token.
  const login = await jsonRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'ContractPass123!' }),
  });
  // Assert that login returned HTTP 201 (created/token issued).
  assert(
    login.response.status === 201,
    `Expected login HTTP 201, received ${login.response.status}.`,
  );
  // Assert that the response provided a usable access token string of reasonable length.
  assert(
    typeof login.body.accessToken === 'string' &&
      login.body.accessToken.length > 20,
    'Login did not return a usable access token.',
  );

  // Request the authenticated identity using the Bearer token to verify authentication and role.
  const identity = await jsonRequest('/auth/me', {
    headers: { Authorization: `Bearer ${login.body.accessToken}` },
  });
  // Assert that identity endpoint returned HTTP 200 (OK).
  assert(
    identity.response.status === 200,
    `Expected identity HTTP 200, received ${identity.response.status}.`,
  );
  // Assert that the identity response preserves the signed-in learner identity and role.
  assert(
    identity.body.user.email === email && identity.body.user.role === 'LEARNER',
    'Identity response did not preserve the signed-in learner identity.',
  );

  // Attempt to access a protected route without supplying an authorization token.
  const protectedWithoutToken = await jsonRequest('/me/enrollments');
  // Assert that accessing a protected route without a token returns HTTP 401 (Unauthorized).
  assert(
    protectedWithoutToken.response.status === 401,
    `Expected protected route HTTP 401 without token, received ${protectedWithoutToken.response.status}.`,
  );

  // Output a JSON summary of important status codes and the test email to the console for CI/logging.
  console.log(
    JSON.stringify(
      {
        healthStatus: health.response.status,
        registrationStatus: registration.response.status,
        loginStatus: login.response.status,
        identityStatus: identity.response.status,
        unauthenticatedStatus: protectedWithoutToken.response.status,
        email,
      },
      null,
      2,
    ),
  );
}

// Invoke the main function without awaiting its completion at top-level to start the test.
void main();
