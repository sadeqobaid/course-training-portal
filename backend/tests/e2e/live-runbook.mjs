// Script name: live-runbook.mjs
// Original location: backend/tests/e2e/live-runbook.mjs
// What this script is: End-to-end live-runbook test script exercising API flows against a running local backend
// What it is used for: To validate full-stack behavior by creating course, lesson, assessment, student, enrollment, completing lesson, attempting assessment, verifying certificate, and querying notifications and reports
// Programming language: JavaScript (ES module)
// Inputs: Environment variable LIVE_API_BASE_URL (optional) and hard-coded test credentials and generated suffix
// Outputs: JSON diagnostic object printed to console containing created resource IDs, progress, scores, certificate and report data
// Where output is saved or sent: console
// Technologies and services used or interacted with: Fetch-based HTTP API; backend authentication, courses, lessons, assessments, enrollments, certificates, notifications, admin reports endpoints
// Downstream scripts/files/processes that consume the output: Any test runner or CI step that invokes this script and inspects stdout; none specified otherwise
// Risks and safe change note: Modifying request payloads, endpoints, or credentials can change test semantics and may create persistent data in the target database; safe changes should preserve API contracts and cleanup expectations
// created by: Sadeq Obaid

// Determine base API URL from environment or fall back to a local default.
const baseUrl = process.env.LIVE_API_BASE_URL ?? 'http://localhost:3100/api/v1';
// Create a compact unique suffix using current timestamp in base36 for resource names to avoid collisions.
const suffix = Date.now().toString(36);


// Define an async helper to perform HTTP requests to the API and return parsed JSON or throw on errors.
async function request(path, options = {}) {
  // Perform fetch against the composed baseUrl and provided path, merging provided options.
  const response = await fetch(`${baseUrl}${path}`, {
    // Spread provided options to allow method, body, etc., to be overridden by callers.
    ...options,
    // Ensure a JSON content-type header is always set and merge any additional headers passed in.
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  // Parse the response body as JSON regardless of status to produce meaningful error messages or return data.
  const body = await response.json();
  // If the response indicates failure (non-2xx), throw an Error containing method, path, and response body for debugging.
  if (!response.ok)
    throw new Error(
      `${options.method ?? 'GET'} ${path} failed: ${JSON.stringify(body)}`,
    );
  // Return the parsed JSON body for successful responses.
  return body;
}

// Define a helper to authenticate a user by posting credentials to the auth endpoint.
async function login(email, password) {
  // Use the request helper to POST credentials to /auth/login and return the resulting auth payload.
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Create a small utility to produce Authorization header objects for authenticated requests.
function bearer(token) {
  // Return an object with the Authorization header set to a Bearer token string for use in request headers.
  return { Authorization: `Bearer ${token}` };
}

// Main flow that exercises admin and student workflows end-to-end.
async function main() {
  // Log in as the admin user to obtain an access token for administrative actions.
  const admin = await login('admin@example.test', 'ChangeMe123!');
  // Create a new course using the admin credentials; the response contains the created course object.
  const course = await request('/courses', {
    // Use POST to create the resource.
    method: 'POST',
    // Provide Authorization header derived from admin access token.
    headers: bearer(admin.accessToken),
    // Send course payload as JSON with unique title/slug using the suffix to avoid collisions.
    body: JSON.stringify({
      title: `Live Validation ${suffix}`,
      slug: `live-validation-${suffix}`,
      description: 'A complete automated validation course description.',
      objectives:
        'Prove the entire full-stack flow works against the real local database.',
      prerequisites: '',
    }),
  });
  // Add a lesson to the newly created course using admin privileges.
  const lesson = await request(`/courses/${course.id}/lessons`, {
    // Create the lesson via POST.
    method: 'POST',
    // Authorize the request with the admin token.
    headers: bearer(admin.accessToken),
    // Provide lesson details including markdown body, position, and published state.
    body: JSON.stringify({
      title: 'One verified lesson',
      bodyMarkdown: 'Read this lesson, then mark it complete.',
      position: 1,
      isPublished: true,
    }),
  });
  // Create an assessment tied to the course (title only initially).
  const assessment = await request(`/courses/${course.id}/assessments`, {
    // Use POST for creation.
    method: 'POST',
    // Admin token required to modify course content.
    headers: bearer(admin.accessToken),
    // Minimal payload with assessment title.
    body: JSON.stringify({ title: 'One-question validation assessment' }),
  });
  // Add a question to the assessment with two options including one correct answer.
  const question = await request(`/assessments/${assessment.id}/questions`, {
    // POST the question resource.
    method: 'POST',
    // Authorize as admin.
    headers: bearer(admin.accessToken),
    // Provide the question prompt, position, and options array with correctness flags.
    body: JSON.stringify({
      prompt: 'Which action records a lesson as complete?',
      position: 1,
      options: [
        { optionText: 'Press the complete lesson button', isCorrect: true },
        { optionText: 'Close the browser', isCorrect: false },
      ],
    }),
  });
  // Publish the course so students can enroll and access content.
  await request(`/courses/${course.id}/publish`, {
    // Publication is a POST action.
    method: 'POST',
    // Requires admin authorization.
    headers: bearer(admin.accessToken),
  });

  // Create a student email using the unique suffix to avoid collisions.
  const studentEmail = `student-${suffix}@example.test`;
  // Register a new student account using the auth registration endpoint (no auth header required).
  await request('/auth/register', {
    // Use POST to create the user.
    method: 'POST',
    // Payload contains email, password, and full name for the test student.
    body: JSON.stringify({
      email: studentEmail,
      password: 'StudentPass123!',
      fullName: 'Validation Student',
    }),
  });
  // Log in as the newly registered student to obtain an access token for student actions.
  const student = await login(studentEmail, 'StudentPass123!');
  // Enroll the student into the published course and capture the enrollment object.
  const enrollment = await request(`/courses/${course.id}/enroll`, {
    // Enrollment is performed with a POST.
    method: 'POST',
    // Use the student's access token for authorization.
    headers: bearer(student.accessToken),
  });
  // Mark the lesson as complete for the enrollment, recording progress for the student.
  const progress = await request(
    `/enrollments/${enrollment.id}/lessons/${lesson.id}/complete`,
    { method: 'POST', headers: bearer(student.accessToken) },
  );
  // Find the option object in the created question that is flagged as correct for automated answering.
  const correctOption = question.options.find((option) => option.isCorrect);
  // If no correct option is found, abort the test with a clear error for diagnosis.
  if (!correctOption)
    throw new Error('The test could not find the known correct answer option.');
  // Submit an assessment attempt for the student using the known correct option to simulate passing.
  const result = await request(
    `/enrollments/${enrollment.id}/assessments/${assessment.id}/attempts`,
    {
      // Attempt creation via POST.
      method: 'POST',
      // Authorize as the student performing the attempt.
      headers: bearer(student.accessToken),
      // Send answers array with the question and chosen option IDs.
      body: JSON.stringify({
        answers: [{ questionId: question.id, optionId: correctOption.id }],
      }),
    },
  );
  // Verify the issued certificate by calling the certificate verification endpoint with the verification code.
  const certificate = await request(
    `/certificates/verify/${result.certificate.verification_code}`,
  );
  // Retrieve notifications for the student to ensure notification generation works.
  const notifications = await request('/notifications', {
    // Authorize as student when fetching personal notifications.
    headers: bearer(student.accessToken),
  });
  // Query the admin completions report to verify administrative reporting of completions includes the created course.
  const report = await request('/admin/reports/completions', {
    // Admin token required to access admin reports.
    headers: bearer(admin.accessToken),
  });

  // Output a JSON summary to stdout containing key identifiers and verification data collected during the run.
  console.log(
    JSON.stringify(
      {
        // Include the created course ID.
        courseId: course.id,
        // Include the enrollment ID for cross-reference.
        enrollmentId: enrollment.id,
        // Include the reported progress percent after completing the lesson.
        progressPercent: progress.progressPercent,
        // Include the assessment score percent from the attempt result.
        scorePercent: result.scorePercent,
        // Include the boolean passed value from the attempt.
        passed: result.passed,
        // Include the certificate number as verified from the certificate endpoint.
        certificateNumber: certificate.certificate_number,
        // Include the count of notifications returned for the student.
        notificationCount: notifications.length,
        // Include the row from the admin report corresponding to the created course, if any.
        reportRow: report.find((row) => row.course_id === course.id),
      },
      null,
      2,
    ),
  );
}

// Kick off the main async flow and deliberately ignore its returned promise.
void main();
