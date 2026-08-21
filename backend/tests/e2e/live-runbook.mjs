const baseUrl = process.env.LIVE_API_BASE_URL ?? 'http://localhost:3100/api/v1';
const suffix = Date.now().toString(36);

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      `${options.method ?? 'GET'} ${path} failed: ${JSON.stringify(body)}`,
    );
  return body;
}

async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function main() {
  const admin = await login('admin@example.test', 'ChangeMe123!');
  const course = await request('/courses', {
    method: 'POST',
    headers: bearer(admin.accessToken),
    body: JSON.stringify({
      title: `Live Validation ${suffix}`,
      slug: `live-validation-${suffix}`,
      description: 'A complete automated validation course description.',
      objectives:
        'Prove the entire full-stack flow works against the real local database.',
      prerequisites: '',
    }),
  });
  const lesson = await request(`/courses/${course.id}/lessons`, {
    method: 'POST',
    headers: bearer(admin.accessToken),
    body: JSON.stringify({
      title: 'One verified lesson',
      bodyMarkdown: 'Read this lesson, then mark it complete.',
      position: 1,
      isPublished: true,
    }),
  });
  const assessment = await request(`/courses/${course.id}/assessments`, {
    method: 'POST',
    headers: bearer(admin.accessToken),
    body: JSON.stringify({ title: 'One-question validation assessment' }),
  });
  const question = await request(`/assessments/${assessment.id}/questions`, {
    method: 'POST',
    headers: bearer(admin.accessToken),
    body: JSON.stringify({
      prompt: 'Which action records a lesson as complete?',
      position: 1,
      options: [
        { optionText: 'Press the complete lesson button', isCorrect: true },
        { optionText: 'Close the browser', isCorrect: false },
      ],
    }),
  });
  await request(`/courses/${course.id}/publish`, {
    method: 'POST',
    headers: bearer(admin.accessToken),
  });

  const studentEmail = `student-${suffix}@example.test`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      password: 'StudentPass123!',
      fullName: 'Validation Student',
    }),
  });
  const student = await login(studentEmail, 'StudentPass123!');
  const enrollment = await request(`/courses/${course.id}/enroll`, {
    method: 'POST',
    headers: bearer(student.accessToken),
  });
  const progress = await request(
    `/enrollments/${enrollment.id}/lessons/${lesson.id}/complete`,
    { method: 'POST', headers: bearer(student.accessToken) },
  );
  const correctOption = question.options.find((option) => option.isCorrect);
  if (!correctOption)
    throw new Error('The test could not find the known correct answer option.');
  const result = await request(
    `/enrollments/${enrollment.id}/assessments/${assessment.id}/attempts`,
    {
      method: 'POST',
      headers: bearer(student.accessToken),
      body: JSON.stringify({
        answers: [{ questionId: question.id, optionId: correctOption.id }],
      }),
    },
  );
  const certificate = await request(
    `/certificates/verify/${result.certificate.verification_code}`,
  );
  const notifications = await request('/notifications', {
    headers: bearer(student.accessToken),
  });
  const report = await request('/admin/reports/completions', {
    headers: bearer(admin.accessToken),
  });

  console.log(
    JSON.stringify(
      {
        courseId: course.id,
        enrollmentId: enrollment.id,
        progressPercent: progress.progressPercent,
        scorePercent: result.scorePercent,
        passed: result.passed,
        certificateNumber: certificate.certificate_number,
        notificationCount: notifications.length,
        reportRow: report.find((row) => row.course_id === course.id),
      },
      null,
      2,
    ),
  );
}

void main();
