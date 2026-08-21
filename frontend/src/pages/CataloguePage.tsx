// Script name: CataloguePage.tsx
// Original location: frontend/src/pages/CataloguePage.tsx
// What this script is: A React page component that fetches and displays published courses.
// What it is used for: To show a catalogue of published courses, handle API fetching, display errors, and render CourseCard components for each course.
// Programming language: TypeScript with JSX (TSX)
// Inputs: No direct props; reads course data from the backend via the api client and uses React state/hooks.
// Outputs: Renders HTML/JSX to the browser DOM (visual UI). No files or DB writes performed here.
// Where output is saved or sent: browser/session storage: None (rendered to DOM); HTTP/API: this component reads from HTTP API; no direct persistent outputs.
// Technologies and services used or interacted with: React, custom api client at ../api/client, CourseCard component, TypeScript types from ../types/api.
// Downstream scripts/files/processes that consume the output: The browser DOM/consumer components; no other internal file consumes a return value from this component directly.
// Risks and safe change note: Changing data fetching, error handling, or JSX structure may break the UI or cause runtime type mismatches; ensure API shape (Course[]) matches types, and that CourseCard accepts the course prop. Keep dependency array correct to avoid repeated fetches. Test UI and API contract if modifying.
// created by: Sadeq Obaid

// Import React hooks used for component state and lifecycle management.
import { useEffect, useState } from 'react';
// Import the typed API client function used to fetch courses from the backend.
import { api } from '../api/client';
// Import the CourseCard component used to render individual course items.
import { CourseCard } from '../components/CourseCard';
// Import the Course TypeScript type to type the state and API responses.
import type { Course } from '../types/api';

// Declare and export the CataloguePage React functional component.
export function CataloguePage() {
  // Initialize local state 'courses' as an empty array typed to Course[]; setCourses updates it.
  const [courses, setCourses] = useState<Course[]>([]);
  // Initialize local state 'error' as null|string; setError updates error messages for display.
  const [error, setError] = useState<string | null>(null);
  // Side-effect hook that runs on mount to fetch the list of published courses from the API.
  useEffect(() => {
    // Invoke the API client to fetch an array of Course objects from the '/courses' endpoint.
    api<Course[]>('/courses')
      // On successful response, update the courses state with the fetched array.
      .then(setCourses)
      // On error, capture the Error message and store it in the error state for display.
      .catch((err: Error) => setError(err.message));
  // Empty dependency array ensures this effect runs only once when the component mounts.
  }, []);
  // Return the JSX structure that renders the page content based on state.
  return (
    // Main container element for the page content.
    <main>
      // Primary heading describing the page content.
      <h1>Published courses</h1>
      // Introductory paragraph explaining what the user can do on this page.
      <p>Choose a course to read its objective, prerequisites, and lessons.</p>
      // Conditional rendering: if there is an error string, render it inside a paragraph with error styling.
      {error && <p className="error">{error}</p>}
      // Section element with class "grid" to layout course cards in a grid.
      <section className="grid">
        // Iterate over the courses array and render a CourseCard for each course item.
        {courses.map((course) => (
          // Render the CourseCard component, providing a stable key via course.id and passing the course data as a prop.
          <CourseCard key={course.id} course={course} />
        ))}
      </section>
      // Conditional rendering for an empty-state: show message only when there are no courses and no error occurred.
      {courses.length === 0 && !error && (
        // Section styled as a card to display the empty-state message.
        <section className="card empty-state">
          // Subheading indicating no published courses are present.
          <h2>No published courses are available yet</h2>
          // Paragraph explaining why there might be no published courses and who can publish them.
          <p>
            An instructor can create lessons and assessments, but a Training Administrator or System Administrator must publish the course before learners can see it here.
          </p>
        </section>
      )}
    </main>
  );
}
