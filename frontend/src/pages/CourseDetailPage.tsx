// Script name: CourseDetailPage.tsx
// Original location: frontend/src/pages/CourseDetailPage.tsx
// What this script is: React component that fetches and displays a course detail page and allows enrollment
// What it is used for: Shows course metadata, lessons, handles enrollment and navigation to learning session
// Programming language: TypeScript (TSX / React)
// Inputs: route parameter 'id' (string), auth token from AuthContext, user click events
// Outputs: UI rendering (JSX), enrollment API POST, navigation actions (redirects)
// Where output is saved or sent: HTTP/API (fetches course, POSTs enrollment); browser navigation; not persisted locally (None for filesystem/session storage)
// Technologies and services used or interacted with: React, react-router-dom, internal api client, AuthContext, backend course/enrollment API
// Downstream scripts/files/processes that consume the output: Learn page route (/learn/:id), other UI components reading course/enrollment state or backend
// Risks and safe change note: Network calls depend on backend; changing API paths, response shapes, or auth flow may break enrollment/navigation; preserve tokens, error handling, and loading states when modifying
// created by: Sadeq Obaid

// Import React hooks used for lifecycle (useEffect) and component state (useState).
import { useEffect, useState } from 'react';
// Import router hooks: useParams to access route parameters and useNavigate for programmatic navigation.
import { useParams, useNavigate } from 'react-router-dom';
// Import the application's api client helper used to perform HTTP requests to backend endpoints.
import { api } from '../api/client';
// Import authentication hook to retrieve current auth token and user context.
import { useAuth } from '../auth/AuthContext';
// Import TypeScript types to type the course and lesson data shapes returned by the API.
import type { Course, Lesson } from '../types/api';

// Export the CourseDetailPage component which renders details for a single course and an enroll action.
export function CourseDetailPage() {
  // Read 'id' parameter from the current route; used to fetch the specific course.
  const { id } = useParams();
  // Retrieve auth token from context; used when performing authenticated requests (enroll).
  const { token } = useAuth();
  // Get navigate function to redirect the user to other routes (login, learn).
  const navigate = useNavigate();
  // Define state 'detail' to hold the fetched course and its lessons; it's null while loading.
  const [detail, setDetail] = useState<{
    // Type annotation: 'course' field holds a Course object as returned by the API.
    course: Course;
    // Type annotation: 'lessons' field is an array of Lesson objects for the course.
    lessons: Lesson[];
  } | null>(null);
  // Define state 'error' to hold an error message string when operations fail; null means no error.
  const [error, setError] = useState<string | null>(null);
  // useEffect sets up a side effect to fetch course details from the backend when 'id' changes.
  useEffect(() => {
    // Only attempt the API fetch when an 'id' route parameter is present.
    if (id)
      // Call the api helper to GET the course detail endpoint; the generic types describe the expected shape.
      api<{ course: Course; lessons: Lesson[] }>(`/courses/${id}`)
        // On success, update the 'detail' state with the returned object so the UI can render it.
        .then(setDetail)
        // On failure, capture the error message in 'error' state to display to the user.
        .catch((err: Error) => setError(err.message));
  }, [id]);
  // Define an async function to enroll the current user in the course and navigate to the learning session.
  async function enroll() {
    // Guard: if there is no course id or no auth token, redirect the user to login first.
    if (!id || !token) {
      // Navigate to login page when authentication is missing.
      navigate('/login');
      // Return early to prevent attempting enrollment without credentials.
      return;
    }
    // Try block to perform enrollment API call and handle navigation on success.
    try {
      // Call the enrollment endpoint with POST and await response which contains an enrollment id.
      const enrollment = await api<{ id: string }>(
        // Endpoint URL for enrolling the authenticated user in this course.
        `/courses/${id}/enroll`,
        // Pass the auth token to the api helper to authenticate the request.
        token,
        // Send explicit options to indicate this is a POST request.
        { method: 'POST' },
      );
      // On successful enrollment, navigate to the learning page using the returned enrollment id.
      navigate(`/learn/${enrollment.id}`);
    } catch (err) {
      // On error, set a user-visible error message in state; use fallback text if err is not an Error.
      setError(err instanceof Error ? err.message : 'Enrollment failed.');
    }
  }
  // If an error message exists in state, render a minimal UI that shows the error.
  if (error)
    return (
      // Main container for error display.
      <main>
        // Paragraph element that displays the error text and can be styled via "error" class.
        <p className="error">{error}</p>
      </main>
    );
  // If detail state is still null, show a loading indicator while the fetch completes.
  if (!detail)
    return (
      // Main container for loading state.
      <main>
        // Simple loading message shown until course details are available.
        <p>Loading course…</p>
      </main>
    );
  // When there is no error and detail is populated, render the full course detail view.
  return (
    // Main wrapper for course content and actions.
    <main>
      // Render the course title inside an H1 element from the fetched detail data.
      <h1>{detail.course.title}</h1>
      // Render the course description paragraph from the course data.
      <p>{detail.course.description}</p>
      // Section header for Objectives.
      <h2>Objectives</h2>
      // Render course objectives text.
      <p>{detail.course.objectives}</p>
      // Section header for Prerequisites.
      <h2>Prerequisites</h2>
      // Render prerequisites or fallback string when none are provided.
      <p>{detail.course.prerequisites || 'No prerequisites.'}</p>
      // Section header for Lessons list.
      <h2>Lessons</h2>
      // Ordered list that will contain each lesson title.
      <ol>
        // Map over the lessons array to generate list items; each iteration yields one <li>.
        {detail.lessons.map((lesson) => (
          // List item for a single lesson, using lesson.id as the React key and showing the title.
          <li key={lesson.id}>{lesson.title}</li>
        ))}
      </ol>
      // Button that triggers the enroll function when clicked to initiate enrollment and navigation.
      <button onClick={enroll}>Enroll and start learning</button>
    </main>
  );
}
