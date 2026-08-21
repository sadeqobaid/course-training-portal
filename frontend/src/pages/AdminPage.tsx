// Script name: AdminPage.tsx
// Original location: frontend/src/pages/AdminPage.tsx
// What this script is: A React component implementing an administrative workspace page for course management.
// What it is used for: Provides UI and logic to create courses, lessons, assessments, manage users, publish courses, and send announcements.
// Programming language: TypeScript with JSX (TSX)
// Inputs: User interactions (forms, buttons), authenticated API token from AuthContext, form data values, server API responses.
// Outputs: Network requests to backend API endpoints, UI state updates, on-screen messages/errors; no files written locally.
// Where output is saved or sent: HTTP/API (backend endpoints); None for filesystem/database direct writes (server handles persistence).
// Technologies and services used or interacted with: React, Fetch-like api client, AuthContext, TypeScript types, browser DOM forms.
// Downstream scripts/files/processes that consume the output: Backend endpoints under /courses, /management, /admin (server-side processes); no direct local consumers.
// Risks and safe change note: Changing API paths, request payload shapes, or auth usage can break server communication; UI text and role checks are security-sensitive — test with real backend and roles. Keep TypeScript types in sync with backend. Make minimal, well-tested changes.
// created by: Sadeq Obaid

// Import React hooks used to drive component state, memoization, and lifecycle effects.
import { useEffect, useMemo, useState } from 'react';
// Import FormEvent type to type form event handlers.
import type { FormEvent } from 'react';
// Import a typed API client helper used to call backend endpoints with the auth token.
import { api } from '../api/client';
// Import authentication context hook to obtain current user and token.
import { useAuth } from '../auth/AuthContext';
// Import TypeScript types describing API shapes used in this component.
import type { Course, ManagedCourse, ManagedUser, UserRole } from '../types/api';
// Import helper functions: buildQuestionPayload constructs question payloads; captureAsyncFormTarget safely captures form element for async handlers.
import { buildQuestionPayload, captureAsyncFormTarget } from './workspace.helpers';

// Define local Report type matching the backend report structure used in completion reports.
type Report = {
  course_id: string;
  title: string;
  total_enrollments: string;
  completed_enrollments: string;
};

// Declare and export the AdminPage React component which renders the administrative workspace UI and contains its logic.
export function AdminPage() {
  // Retrieve auth token and current user from context for authenticated API calls and role checks.
  const { token, user } = useAuth();
  // State holding completion reports for publishing roles.
  const [reports, setReports] = useState<Report[]>([]);
  // State holding the list of managed courses retrieved from the backend.
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  // State holding the list of managed users for system admin.
  const [users, setUsers] = useState<ManagedUser[]>([]);
  // State for the course currently selected in the UI; used when adding lessons/assessments.
  const [selectedCourse, setSelectedCourse] = useState<ManagedCourse | null>(null);
  // State storing the currently selected/created assessment id for adding questions.
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  // State storing the last error message to display to the user.
  const [error, setError] = useState<string | null>(null);
  // State storing general success/info messages to display to the user.
  const [message, setMessage] = useState<string | null>(null);
  // Boolean indicating whether the current user has publish privileges based on their role.
  const canPublish = ['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(user?.role ?? '');
  // Boolean indicating whether the current user can manage users (system admin only).
  const canManageUsers = user?.role === 'SYSTEM_ADMIN';
  // Memoized human-facing role title derived from the user's role to avoid recalculating on each render.
  const roleTitle = useMemo(() => {
    if (user?.role === 'SYSTEM_ADMIN') return 'System administration';
    if (user?.role === 'TRAINING_ADMIN') return 'Training workspace';
    return 'Instructor workspace';
  }, [user?.role]);

  // Async function to load workspace data: courses, reports if allowed, and users if allowed.
  async function loadWorkspace() {
    // Skip loading if no auth token is present.
    if (!token) return;
    try {
      // Fetch managed courses and optionally completion reports in parallel.
      const [managedCourses, completionReports] = await Promise.all([
        api<ManagedCourse[]>('/management/courses', token),
        canPublish ? api<Report[]>('/admin/reports/completions', token) : Promise.resolve([]),
      ]);
      // Update state with fetched courses and reports.
      setCourses(managedCourses);
      setReports(completionReports);
      // If the current user can manage users, fetch managed users and update state.
      if (canManageUsers) setUsers(await api<ManagedUser[]>('/admin/users', token));
      // Clear any existing error on successful load.
      setError(null);
    } catch (err) {
      // On failure, set an error message derived from the thrown error or a fallback string.
      setError(err instanceof Error ? err.message : 'Could not load this workspace.');
    }
  }

  // Effect hook to load workspace data when dependencies change: token, canPublish, or canManageUsers.
  useEffect(() => {
    // Fire-and-forget loadWorkspace; void used to indicate we intentionally ignore the returned promise.
    void loadWorkspace();
  }, [token, canPublish, canManageUsers]);

  // Helper to set a non-error announcement message and clear errors.
  function announce(text: string) {
    setMessage(text);
    setError(null);
  }

// Async handler for creating a new course from the form submission.
async function createCourse(event: FormEvent<HTMLFormElement>) {
    // Prevent default synchronous form submission behavior.
    event.preventDefault();
    // Do nothing if there's no auth token.
    if (!token) return;
    // Capture the form element safely for asynchronous operations using captureAsyncFormTarget.
    const formElement = captureAsyncFormTarget(event.currentTarget);
    // Build a FormData object to read input values.
    const form = new FormData(formElement);
    try {
      // Post a new course to the /courses endpoint with values extracted from the form.
      const course = await api<Course>('/courses', token, {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          slug: form.get('slug'),
          description: form.get('description'),
          objectives: form.get('objectives'),
          prerequisites: form.get('prerequisites'),
        }),
      });
      // Announce success and prompt the user to select the new course for adding content.
      announce(`Draft course “${course.title}” created. Select it below to add lessons and assessment content.`);
      // Reload the workspace to refresh course lists and counts.
      await loadWorkspace();
      // Preselect the newly created course in state with default counters and created_by set to current user id.
      setSelectedCourse({
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        created_by: user?.id ?? '',
        lesson_count: '0', assessment_count: '0', enrollment_count: '0', completed_count: '0',
      });
      // Reset the form UI after successful creation.
      formElement.reset();
    } catch (err) {
      // On error, set an appropriate error message.
      setError(err instanceof Error ? err.message : 'Course creation failed.');
    }
  }
// Async handler for adding a lesson to the currently selected course.
async function addLesson(event: FormEvent<HTMLFormElement>) {
    // Prevent default browser form submit.
    event.preventDefault();
    // Ensure we have a token and a selected course to add the lesson to.
    if (!token || !selectedCourse) return;
    // Safely capture the form element for async use.
    const formElement = captureAsyncFormTarget(event.currentTarget);
    // Read form fields using FormData.
    const form = new FormData(formElement);
    try {
      // Post the new lesson to the backend under the selected course ID.
      await api(`/courses/${selectedCourse.id}/lessons`, token, {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          bodyMarkdown: form.get('bodyMarkdown'),
          position: Number(form.get('position')),
          isPublished: form.get('isPublished') === 'on',
        }),
      });
      // Inform the user about lesson save and the publication prerequisite for courses.
      announce('Lesson saved. A course needs at least one published lesson before a Training Administrator or System Administrator can publish it.');
      // Reset form inputs.
      formElement.reset();
      // Refresh workspace data to reflect the added lesson.
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Lesson creation failed.'); }
  }
// Async handler for creating an assessment for the selected course.
async function createAssessment(event: FormEvent<HTMLFormElement>) {
    // Prevent default form submit behavior.
    event.preventDefault();
    // Require auth token and a selected course.
    if (!token || !selectedCourse) return;
    // Capture the form element safely for async handling.
    const formElement = captureAsyncFormTarget(event.currentTarget);
    // Read input values from the form.
    const form = new FormData(formElement);
    try {
      // Post a new assessment object containing only the title to the backend.
      const assessment = await api<{ id: string; title: string }>(`/courses/${selectedCourse.id}/assessments`, token, {
        method: 'POST', body: JSON.stringify({ title: form.get('title') }),
      });
      // Store the returned assessment id to allow adding questions next.
      setAssessmentId(assessment.id);
      // Announce successful creation so the user can proceed to add questions.
      announce(`Assessment “${assessment.title}” created. Add questions below.`);
      // Reset the creation form UI.
      formElement.reset();
      // Refresh workspace data to reflect the new assessment.
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Assessment creation failed.'); }
  }
// Async handler for adding a question to the currently selected assessment.
async function addQuestion(event: FormEvent<HTMLFormElement>) {
    // Prevent default form submission.
    event.preventDefault();
    // Require authentication and an assessment to add the question to.
    if (!token || !assessmentId) return;
    // Safely capture the form element reference for async operations.
    const formElement = captureAsyncFormTarget(event.currentTarget);
    // Extract form values via FormData.
    const form = new FormData(formElement);
    try {
      // Build a payload for the question using helper that enforces structure and correct answer index.
      const payload = buildQuestionPayload(
        String(form.get('prompt') ?? ''), Number(form.get('position')),
        [1, 2, 3, 4].map((index) => ({ text: String(form.get(`option${index}`) ?? '') })),
        Number(form.get('correctIndex')),
      );
      // Post the question payload to the assessment questions endpoint.
      await api(`/assessments/${assessmentId}/questions`, token, { method: 'POST', body: JSON.stringify(payload) });
      // Announce success and encourage adding more questions or publishing.
      announce('Question saved with exactly one correct answer. Add another question or publish when the course is ready.');
      // Reset the question form inputs.
      formElement.reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Question creation failed.'); }
  }
  // Async function to publish the selected course by calling the publish endpoint.
  async function publishCourse() {
    // Require auth token and a selected course to publish.
    if (!token || !selectedCourse) return;
    try {
      // Trigger a POST to the publish endpoint for the selected course.
      await api(`/courses/${selectedCourse.id}/publish`, token, { method: 'POST' });
      // Announce that the course is now published and visible to learners.
      announce(`Course “${selectedCourse.title}” is now published and visible in the learner catalogue.`);
      // Reload workspace to update course status and lists.
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Course publication failed.'); }
  }
// Async handler to create a managed user account (system admin action).
async function createManagedUser(event: FormEvent<HTMLFormElement>) {
    // Prevent default submission.
    event.preventDefault();
    // Require auth token to perform admin actions.
    if (!token) return;
    // Capture the form element for async operations.
    const formElement = captureAsyncFormTarget(event.currentTarget);
    // Read form values.
    const form = new FormData(formElement);
    try {
      // Post the new managed user to the /admin/users endpoint with required fields.
      await api('/admin/users', token, { method: 'POST', body: JSON.stringify({
        email: form.get('email'), fullName: form.get('fullName'), password: form.get('password'), role: form.get('role'),
      }) });
      // Notify that the account was created and instruct secure communication of credentials.
      announce('Account created. Give the sign-in details to the new team member through an approved private channel.');
      // Reset the form UI.
      formElement.reset();
      // Refresh workspace data to include the new account.
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Account creation failed.'); }
  }
  // Function to update a managed user's role or active status using a PATCH request.
  async function updateManagedUser(item: ManagedUser, patch: { role?: UserRole; isActive?: boolean }) {
    // Require auth token to perform the update.
    if (!token) return;
    try {
      // Send a PATCH with the provided changes to the specific managed user endpoint.
      await api(`/admin/users/${item.id}`, token, { method: 'PATCH', body: JSON.stringify(patch) });
      // Announce successful update with the user's full name.
      announce(`Updated ${item.full_name}.`);
      // Refresh workspace data so UI reflects updated user list and statuses.
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'User update failed.'); }
  }
// Async handler to send an in-app announcement to a role group via the management API.
async function sendAnnouncement(event: FormEvent<HTMLFormElement>) {
    // Prevent browser default submission behavior.
    event.preventDefault();
    // Require authentication token.
    if (!token) return;
    // Capture form element safely for async use.
    const formElement = captureAsyncFormTarget(event.currentTarget);
    // Read form data values for subject, body, and recipient role.
    const form = new FormData(formElement);
    try {
      // Post announcement payload to the management announcements endpoint and expect recipient count back.
      const result = await api<{ recipients: number }>('/management/announcements', token, { method: 'POST', body: JSON.stringify({
        subject: form.get('subject'), body: form.get('body'), recipientRole: form.get('recipientRole'),
      }) });
      // Announce how many recipients received the announcement, using the selected role text.
      announce(`Announcement created for ${result.recipients} active ${String(form.get('recipientRole')).toLowerCase()} account(s).`);
      // Reset the announcement form UI.
      formElement.reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Announcement failed.'); }
  }
  // Render the administrative workspace UI with conditional sections based on roles and selected entities.
  return (
    <main className="workspace">
      <header className="workspace-header">
        <div><p className="eyebrow">{user?.role.replaceAll('_', ' ')}</p><h1>{roleTitle}</h1></div>
        <p>{canPublish ? 'Create, publish, monitor, and communicate training.' : 'Create your own course content. A Training Administrator or System Administrator publishes it.'}</p>
      </header>
      {/* Conditionally render an error paragraph when an error message is present. */}
      {error && <p className="error">{error}</p>}
      {/* Conditionally render a success/info message when present. */}
      {message && <p className="success">{message}</p>}
      <section className="workspace-grid">
      <div className="card">
      <h2>1. Create a draft course</h2>
      {/* Form for creating a draft course; submission handled by createCourse */}
      <form onSubmit={createCourse}>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          Slug
          <input name="slug" required />
        </label>
        <label>
          Description
          <textarea name="description" required />
        </label>
        <label>
          Objectives
          <textarea name="objectives" required />
        </label>
        <label>
          Prerequisites
          <textarea name="prerequisites" />
        </label>
        <button>Create draft</button>
      </form>
      </div>
      <div className="card">
        <h2>2. Select a course</h2>
        <p>Select a draft or published course to add content and review its readiness.</p>
        <div className="course-select-list">
          {/* Map over courses to render selectable buttons; selecting sets selectedCourse and clears any selected assessment */}
          {courses.map((course) => <button className={selectedCourse?.id === course.id ? 'selected-course' : 'secondary'} key={course.id} onClick={() => { setSelectedCourse(course); setAssessmentId(null); }}>
            {course.title} — {course.status} · {course.lesson_count} lesson(s) · {course.enrollment_count} enrollment(s)
          </button>)}
        </div>
      </div>
      </section>
      {/* If a course is selected, render the build workflow including adding lessons, creating assessments, adding questions, and publishing */}
      {selectedCourse && <section className="selected-workflow card">
        <h2>3. Build “{selectedCourse.title}”</h2>
        <div className="workspace-grid">
          {/* Inline form to add a lesson; uses addLesson on submit */}
          <form onSubmit={addLesson}><h3>Add lesson</h3><label>Lesson title<input name="title" required /></label><label>Lesson content<textarea name="bodyMarkdown" required /></label><label>Position<input name="position" type="number" min="1" defaultValue={Number(selectedCourse.lesson_count) + 1} required /></label><label className="check-label"><input name="isPublished" type="checkbox" defaultChecked />Publish this lesson now</label><button>Save lesson</button></form>
          {/* Inline form to create an assessment; on success assessmentId is set */}
          <form onSubmit={createAssessment}><h3>Create assessment</h3><label>Assessment title<input name="title" required /></label><button>Create assessment</button>{assessmentId && <p className="success">Assessment selected. Add questions in the next form.</p>}</form>
          {/* Inline form to add a question to the selected assessment; maps option inputs */}
          <form onSubmit={addQuestion}><h3>Add assessment question</h3><label>Question prompt<textarea name="prompt" required /></label><label>Position<input name="position" type="number" min="1" defaultValue="1" required /></label>{[1, 2, 3, 4].map((index) => <label key={index}>Option {index}<input name={`option${index}`} required /></label>)}<label>Correct option<select name="correctIndex" defaultValue="0"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option><option value="3">Option 4</option></select></label><button disabled={!assessmentId}>Save question</button></form>
        </div>
        {/* If the user can publish, show a Publish button wired to publishCourse; otherwise show guidance text */}
        {canPublish ? <button className="publish-button" onClick={() => void publishCourse()}>Publish selected course</button> : <p className="info">When content is ready, ask a Training Administrator or System Administrator to publish this course.</p>}
      </section>}
      {/* If the user can publish, render reports and announcement form */}
      {canPublish && <section className="workspace-grid">
      <div className="card"><h2>Completion report</h2>
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Enrollments</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {/* Render rows for each completion report */}
          {reports.map((report) => (
            <tr key={report.course_id}>
              <td>{report.title}</td>
              <td>{report.total_enrollments}</td>
              <td>{report.completed_enrollments}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {/* Form to send an in-app announcement to a role; handled by sendAnnouncement */}
      <form onSubmit={sendAnnouncement}><h2>Send a portal announcement</h2><label>Recipient role<select name="recipientRole" defaultValue="LEARNER"><option value="LEARNER">Learner / Student</option><option value="INSTRUCTOR">Instructor</option><option value="TRAINING_ADMIN">Training Administrator</option></select></label><label>Subject<input name="subject" required /></label><label>Message<textarea name="body" required /></label><button>Send in-app announcement</button></form>
      </section>}
      {/* If the user can manage users, render the system account management UI with create and update functionality */}
      {canManageUsers && <section className="card"><h2>System account management</h2><div className="workspace-grid"><form onSubmit={createManagedUser}><label>Full name<input name="fullName" required /></label><label>Email<input name="email" type="email" required /></label><label>Temporary password<input name="password" type="password" minLength={10} required /></label><label>Role<select name="role" defaultValue="TRAINING_ADMIN"><option value="SYSTEM_ADMIN">System Administrator</option><option value="TRAINING_ADMIN">Training Administrator</option><option value="INSTRUCTOR">Instructor</option><option value="LEARNER">Learner / Student</option></select></label><button>Create account</button></form><div><h3>Existing accounts</h3><table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.full_name}<br /><small>{item.email}</small></td><td><select value={item.role} onChange={(event) => void updateManagedUser(item, { role: event.target.value as UserRole })}>{(['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR', 'LEARNER'] as UserRole[]).map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></td><td>{item.is_active ? 'Active' : 'Inactive'}</td><td><button className="secondary" onClick={() => void updateManagedUser(item, { isActive: !item.is_active })}>{item.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div></div></section>}
    </main>
  );
}
