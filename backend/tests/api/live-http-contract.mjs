const baseUrl = process.env.LIVE_API_BASE_URL ?? 'http://localhost:3100/api/v1';
const unique = Date.now().toString(36);

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await response.json();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const health = await jsonRequest('/health');
  assert(
    health.response.status === 200,
    `Expected health HTTP 200, received ${health.response.status}.`,
  );
  assert(
    health.body.status === 'ok' && health.body.database === 'reachable',
    'Health response body did not confirm API/database readiness.',
  );

  const email = `http-contract-${unique}@example.test`;
  const registration = await jsonRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: 'ContractPass123!',
      fullName: 'HTTP Contract Learner',
    }),
  });
  assert(
    registration.response.status === 201,
    `Expected registration HTTP 201, received ${registration.response.status}.`,
  );
  assert(
    registration.body.user.email === email,
    'Registration response did not return the created email.',
  );
  assert(
    !('password_hash' in registration.body.user),
    'Registration response exposed a password hash.',
  );

  const login = await jsonRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'ContractPass123!' }),
  });
  assert(
    login.response.status === 201,
    `Expected login HTTP 201, received ${login.response.status}.`,
  );
  assert(
    typeof login.body.accessToken === 'string' &&
      login.body.accessToken.length > 20,
    'Login did not return a usable access token.',
  );

  const identity = await jsonRequest('/auth/me', {
    headers: { Authorization: `Bearer ${login.body.accessToken}` },
  });
  assert(
    identity.response.status === 200,
    `Expected identity HTTP 200, received ${identity.response.status}.`,
  );
  assert(
    identity.body.user.email === email && identity.body.user.role === 'LEARNER',
    'Identity response did not preserve the signed-in learner identity.',
  );

  const protectedWithoutToken = await jsonRequest('/me/enrollments');
  assert(
    protectedWithoutToken.response.status === 401,
    `Expected protected route HTTP 401 without token, received ${protectedWithoutToken.response.status}.`,
  );

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

void main();
