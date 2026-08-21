// Script name: LearningPage.tsx
// Original location: frontend/src/pages/LearningPage.tsx
// What this script is: React page component that displays a user's course enrollment, lessons, and progress, and allows marking lessons complete.
// What it is used for: Renders learning content for a specific enrollment and interacts with backend APIs to fetch enrollments, course lessons, and progress; allows completing lessons.
// Programming language: TypeScript (TSX/React)
// Inputs: URL parameter enrollmentId via react-router, authentication token via AuthContext, backend HTTP API responses.
// Outputs: Rendered HTML in browser; HTTP requests to backend APIs; in-memory React state updates
// Where output is saved or sent: HTTP/API; browser (rendered UI and in-memory session state)
// Technologies and services used or interacted with: React, React Router, custom api client, AuthContext, backend HTTP API
// Downstream scripts/files/processes that consume the output: Assessment page (Link to /assessment/...); other UI components that may read enrollment state; none (direct file consumers not applicable)
// Risks and safe change note: Changing network request paths, dependency lists, or state updates can break enrollment display, progress tracking, or lesson completion; keep API contract and token handling intact; test UX edge cases and error handling.
// created by: Sadeq Obaid

// Import React hooks used for lifecycle and state management.
import { useEffect, useState } from 'react';
// Import routing helpers: Link for navigation and useParams to read route parameters.
import { Link, useParams } from 'react-router-dom';
// Import a generic API client function used to call backend endpoints.
import { api } from '../api/client';
// Import authentication context hook to obtain the current auth token.
import { useAuth } from '../auth/AuthContext';
// Import TypeScript types for Enrollment and Lesson to type component state and API responses.
import type { Enrollment, Lesson } from '../types/api';

// Export the main page component that renders learning content for an enrollment.
export function LearningPage() {
  // Read the enrollmentId parameter from the current route.
  const { enrollmentId } = useParams();
  // Obtain the authentication token from the AuthContext.
  const { token } = useAuth();
  // Local state holding the current enrollment or null before loaded.
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  // Local state holding the list of lessons for the enrollment's course.
  const [lessons, setLessons] = useState<Lesson[]>([]);
  // Local state tracking the user's progress percentage for this enrollment.
  const [progress, setProgress] = useState<number>(0);
  // Local state holding a human-readable error message, if any.
  const [error, setError] = useState<string | null>(null);
  // Effect that loads enrollment, course lessons, and progress when token or enrollmentId change.
  useEffect(() => {
    // Guard clause: if we lack an auth token or route enrollmentId, do nothing.
    if (!token || !enrollmentId) return;
    // Request the current user's enrollments from the backend using the api client.
    api<Enrollment[]>('/me/enrollments', token)
      // When enrollments arrive, find the one matching the enrollmentId route param and store it.
      .then((items) => {
        const found = items.find((item) => item.id === enrollmentId) ?? null;
        setEnrollment(found);
        return found;
      })
      // If the enrollment was found, fetch the course details (including lessons) for that enrollment.
      .then((found) =>
        found
          ? api<{ course: unknown; lessons: Lesson[] }>(
              `/courses/${found.course_id}`,
            ).then((detail) => setLessons(detail.lessons))
          : undefined,
      )
      // On any error in the enrollment or course fetch, set the error state with the error message.
      .catch((err: Error) => setError(err.message));
    // Independently request the progress percentage for this enrollment and update state.
    api<{ progressPercent: number }>(
      `/enrollments/${enrollmentId}/progress`,
      token,
    )
      // When progress data arrives, update the progress state.
      .then((result) => setProgress(result.progressPercent))
      // Ignore progress errors silently by returning undefined (no state change).
      .catch(() => undefined);
  // Re-run this effect when auth token or enrollmentId route parameter change.
  }, [token, enrollmentId]);
  // Async helper to mark a lesson complete for this enrollment.
  async function complete(lessonId: string) {
    // Guard clause: require auth token and enrollmentId before attempting to complete a lesson.
    if (!token || !enrollmentId) return;
    try {
      // POST to the lesson completion endpoint and await the returned progress summary.
      const summary = await api<{ progressPercent: number }>(
        `/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
        token,
        { method: 'POST' },
      );
      // Update local progress state with the value returned by the completion API.
      setProgress(summary.progressPercent);
    } catch (err) {
      // On error, store a readable message in the error state for display.
      setError(
        err instanceof Error ? err.message : 'Could not complete lesson.',
      );
    }
  }
  // If enrollment is not yet loaded, render a simple loading or error message.
  if (!enrollment)
    return (
      // Main container for the loading/error view.
      <main>
        // Paragraph showing any error or a loading indicator text.
        <p>{error ?? 'Loading your enrollment…'}</p>
      </main>
    );
  // Render the fully loaded learning page with enrollment title, progress, lessons list, and assessment link.
  return (
    // Top-level main element for the learning content.
    <main>
      // Heading shows the enrollment title.
      <h1>{enrollment.title}</h1>
      // Paragraph displaying the numeric progress percentage.
      <p>Progress: {progress}%</p>
      // Conditionally show an error paragraph if an error exists.
      {error && <p className="error">{error}</p>}
      // Section containing the list of lesson cards.
      <section>
        // Map over lessons array to render each lesson as an article card.
        {lessons.map((lesson) => (
          // Article element for a single lesson; key uses lesson.id for list identity.
          <article className="card" key={lesson.id}>
            // Lesson title area.
            <h2>
              // Show lesson position followed by its title inside the heading.
              {lesson.position}. {lesson.title}
            </h2>
            // Preformatted block showing the lesson body in markdown form.
            <pre>{lesson.body_markdown}</pre>
            // Button that, when clicked, calls the complete helper with this lesson's id.
            <button onClick={() => complete(lesson.id)}>
              // Visible button text prompting the user to mark the lesson complete.
              Mark lesson complete
            </button>
          </article>
        ))}
      </section>
      // Link to the assessment page for this enrollment and course, constructed from enrollment ids.
      <Link to={`/assessment/${enrollment.id}/${enrollment.course_id}`}>
        // Link text prompting the user to take the course assessment.
        Take course assessment
      </Link>
    </main>
  );
}
