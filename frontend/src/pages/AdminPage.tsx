import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Course, ManagedCourse, ManagedUser, UserRole } from '../types/api';
import { buildQuestionPayload, captureAsyncFormTarget } from './workspace.helpers';

type Report = {
  course_id: string;
  title: string;
  total_enrollments: string;
  completed_enrollments: string;
};

export function AdminPage() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ManagedCourse | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canPublish = ['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(user?.role ?? '');
  const canManageUsers = user?.role === 'SYSTEM_ADMIN';
  const roleTitle = useMemo(() => {
    if (user?.role === 'SYSTEM_ADMIN') return 'System administration';
    if (user?.role === 'TRAINING_ADMIN') return 'Training workspace';
    return 'Instructor workspace';
  }, [user?.role]);

  async function loadWorkspace() {
    if (!token) return;
    try {
      const [managedCourses, completionReports] = await Promise.all([
        api<ManagedCourse[]>('/management/courses', token),
        canPublish ? api<Report[]>('/admin/reports/completions', token) : Promise.resolve([]),
      ]);
      setCourses(managedCourses);
      setReports(completionReports);
      if (canManageUsers) setUsers(await api<ManagedUser[]>('/admin/users', token));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this workspace.');
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [token, canPublish, canManageUsers]);

  function announce(text: string) {
    setMessage(text);
    setError(null);
  }

async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = captureAsyncFormTarget(event.currentTarget);
    const form = new FormData(formElement);
    try {
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
      announce(`Draft course “${course.title}” created. Select it below to add lessons and assessment content.`);
      await loadWorkspace();
      setSelectedCourse({
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        created_by: user?.id ?? '',
        lesson_count: '0', assessment_count: '0', enrollment_count: '0', completed_count: '0',
      });
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Course creation failed.');
    }
  }
async function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedCourse) return;
    const formElement = captureAsyncFormTarget(event.currentTarget);
    const form = new FormData(formElement);
    try {
      await api(`/courses/${selectedCourse.id}/lessons`, token, {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          bodyMarkdown: form.get('bodyMarkdown'),
          position: Number(form.get('position')),
          isPublished: form.get('isPublished') === 'on',
        }),
      });
      announce('Lesson saved. A course needs at least one published lesson before a Training Administrator or System Administrator can publish it.');
      formElement.reset();
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Lesson creation failed.'); }
  }
async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedCourse) return;
    const formElement = captureAsyncFormTarget(event.currentTarget);
    const form = new FormData(formElement);
    try {
      const assessment = await api<{ id: string; title: string }>(`/courses/${selectedCourse.id}/assessments`, token, {
        method: 'POST', body: JSON.stringify({ title: form.get('title') }),
      });
      setAssessmentId(assessment.id);
      announce(`Assessment “${assessment.title}” created. Add questions below.`);
      formElement.reset();
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Assessment creation failed.'); }
  }
async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !assessmentId) return;
    const formElement = captureAsyncFormTarget(event.currentTarget);
    const form = new FormData(formElement);
    try {
      const payload = buildQuestionPayload(
        String(form.get('prompt') ?? ''), Number(form.get('position')),
        [1, 2, 3, 4].map((index) => ({ text: String(form.get(`option${index}`) ?? '') })),
        Number(form.get('correctIndex')),
      );
      await api(`/assessments/${assessmentId}/questions`, token, { method: 'POST', body: JSON.stringify(payload) });
      announce('Question saved with exactly one correct answer. Add another question or publish when the course is ready.');
      formElement.reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Question creation failed.'); }
  }
  async function publishCourse() {
    if (!token || !selectedCourse) return;
    try {
      await api(`/courses/${selectedCourse.id}/publish`, token, { method: 'POST' });
      announce(`Course “${selectedCourse.title}” is now published and visible in the learner catalogue.`);
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Course publication failed.'); }
  }
async function createManagedUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = captureAsyncFormTarget(event.currentTarget);
    const form = new FormData(formElement);
    try {
      await api('/admin/users', token, { method: 'POST', body: JSON.stringify({
        email: form.get('email'), fullName: form.get('fullName'), password: form.get('password'), role: form.get('role'),
      }) });
      announce('Account created. Give the sign-in details to the new team member through an approved private channel.');
      formElement.reset();
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'Account creation failed.'); }
  }
  async function updateManagedUser(item: ManagedUser, patch: { role?: UserRole; isActive?: boolean }) {
    if (!token) return;
    try {
      await api(`/admin/users/${item.id}`, token, { method: 'PATCH', body: JSON.stringify(patch) });
      announce(`Updated ${item.full_name}.`);
      await loadWorkspace();
    } catch (err) { setError(err instanceof Error ? err.message : 'User update failed.'); }
  }
async function sendAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = captureAsyncFormTarget(event.currentTarget);
    const form = new FormData(formElement);
    try {
      const result = await api<{ recipients: number }>('/management/announcements', token, { method: 'POST', body: JSON.stringify({
        subject: form.get('subject'), body: form.get('body'), recipientRole: form.get('recipientRole'),
      }) });
      announce(`Announcement created for ${result.recipients} active ${String(form.get('recipientRole')).toLowerCase()} account(s).`);
      formElement.reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Announcement failed.'); }
  }
  return (
    <main className="workspace">
      <header className="workspace-header">
        <div><p className="eyebrow">{user?.role.replaceAll('_', ' ')}</p><h1>{roleTitle}</h1></div>
        <p>{canPublish ? 'Create, publish, monitor, and communicate training.' : 'Create your own course content. A Training Administrator or System Administrator publishes it.'}</p>
      </header>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <section className="workspace-grid">
      <div className="card">
      <h2>1. Create a draft course</h2>
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
          {courses.map((course) => <button className={selectedCourse?.id === course.id ? 'selected-course' : 'secondary'} key={course.id} onClick={() => { setSelectedCourse(course); setAssessmentId(null); }}>
            {course.title} — {course.status} · {course.lesson_count} lesson(s) · {course.enrollment_count} enrollment(s)
          </button>)}
        </div>
      </div>
      </section>
      {selectedCourse && <section className="selected-workflow card">
        <h2>3. Build “{selectedCourse.title}”</h2>
        <div className="workspace-grid">
          <form onSubmit={addLesson}><h3>Add lesson</h3><label>Lesson title<input name="title" required /></label><label>Lesson content<textarea name="bodyMarkdown" required /></label><label>Position<input name="position" type="number" min="1" defaultValue={Number(selectedCourse.lesson_count) + 1} required /></label><label className="check-label"><input name="isPublished" type="checkbox" defaultChecked />Publish this lesson now</label><button>Save lesson</button></form>
          <form onSubmit={createAssessment}><h3>Create assessment</h3><label>Assessment title<input name="title" required /></label><button>Create assessment</button>{assessmentId && <p className="success">Assessment selected. Add questions in the next form.</p>}</form>
          <form onSubmit={addQuestion}><h3>Add assessment question</h3><label>Question prompt<textarea name="prompt" required /></label><label>Position<input name="position" type="number" min="1" defaultValue="1" required /></label>{[1, 2, 3, 4].map((index) => <label key={index}>Option {index}<input name={`option${index}`} required /></label>)}<label>Correct option<select name="correctIndex" defaultValue="0"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option><option value="3">Option 4</option></select></label><button disabled={!assessmentId}>Save question</button></form>
        </div>
        {canPublish ? <button className="publish-button" onClick={() => void publishCourse()}>Publish selected course</button> : <p className="info">When content is ready, ask a Training Administrator or System Administrator to publish this course.</p>}
      </section>}
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
      <form onSubmit={sendAnnouncement}><h2>Send a portal announcement</h2><label>Recipient role<select name="recipientRole" defaultValue="LEARNER"><option value="LEARNER">Learner / Student</option><option value="INSTRUCTOR">Instructor</option><option value="TRAINING_ADMIN">Training Administrator</option></select></label><label>Subject<input name="subject" required /></label><label>Message<textarea name="body" required /></label><button>Send in-app announcement</button></form>
      </section>}
      {canManageUsers && <section className="card"><h2>System account management</h2><div className="workspace-grid"><form onSubmit={createManagedUser}><label>Full name<input name="fullName" required /></label><label>Email<input name="email" type="email" required /></label><label>Temporary password<input name="password" type="password" minLength={10} required /></label><label>Role<select name="role" defaultValue="TRAINING_ADMIN"><option value="SYSTEM_ADMIN">System Administrator</option><option value="TRAINING_ADMIN">Training Administrator</option><option value="INSTRUCTOR">Instructor</option><option value="LEARNER">Learner / Student</option></select></label><button>Create account</button></form><div><h3>Existing accounts</h3><table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.full_name}<br /><small>{item.email}</small></td><td><select value={item.role} onChange={(event) => void updateManagedUser(item, { role: event.target.value as UserRole })}>{(['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR', 'LEARNER'] as UserRole[]).map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></td><td>{item.is_active ? 'Active' : 'Inactive'}</td><td><button className="secondary" onClick={() => void updateManagedUser(item, { isActive: !item.is_active })}>{item.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div></div></section>}
    </main>
  );
}
