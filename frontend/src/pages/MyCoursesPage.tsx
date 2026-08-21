// Script name: MyCoursesPage.tsx
// Original location: frontend/src/pages/MyCoursesPage.tsx
// What this script is: A React functional component page that displays the authenticated user's course enrollments.
// What it is used for: Fetches the current user's enrollments and renders them as cards, with links to continue learning.
// Programming language: TypeScript with JSX (TSX)
// Inputs: Auth token from AuthContext and data from the '/me/enrollments' HTTP API endpoint.
// Outputs: Rendered UI in the browser (DOM).
// Where output is saved or sent: browser/session storage
// Technologies and services used or interacted with: React, react-router-dom, internal api client, AuthContext, TypeScript
// Downstream scripts/files/processes that consume the output: Route handlers and learning pages such as the Learn page at /learn/:id may be navigated to from this component.
// Risks and safe change note: Changes to the API path, token handling, or state management can break data fetching or render logic; avoid changing dependency arrays or removing error handling without regression testing.
// created by: Sadeq Obaid

// Import React hooks used for lifecycle and state management.
import { useEffect, useState } from 'react';
// Import Link component to enable client-side navigation to course learning pages.
import { Link } from 'react-router-dom';
// Import a typed API client helper for making authenticated requests.
import { api } from '../api/client';
// Import authentication context hook to obtain the current user's token.
import { useAuth } from '../auth/AuthContext';
// Import the Enrollment type to type the component state and API responses.
import type { Enrollment } from '../types/api';

// Export the page component so router or parent modules can render the "My courses" view.
export function MyCoursesPage() {
  // Destructure token from the authentication context; token is used to authorize API requests.
  const { token } = useAuth();
  // Local state for the list of enrollments retrieved from the API; initialized to an empty array.
  const [items, setItems] = useState<Enrollment[]>([]);
  // Local state for a possible error message string; null means no error.
  const [error, setError] = useState<string | null>(null);
  // Effect hook that runs when the component mounts and whenever the token value changes.
  useEffect(() => {
    // Only attempt to fetch enrollments if an auth token is present (user is authenticated).
    if (token)
      // Call the typed api helper to fetch the current user's enrollments using the token.
      api<Enrollment[]>('/me/enrollments', token)
        // On successful response, update the items state with the fetched enrollments.
        .then(setItems)
        // On failure, capture the error message into the error state for display.
        .catch((err: Error) => setError(err.message));
  // Dependency array ensures this effect re-runs when the token changes.
  }, [token]);
  // Return the JSX tree to render the page UI based on current state (items and error).
  return (
    // Root element for the page content.
    <main>
      // Page heading displayed at the top of the page.
      <h1>My courses</h1>
      // Conditionally render an error paragraph when an error message exists.
      {error && <p className="error">{error}</p>}
      // Section element to contain a grid of course cards.
      <section className="grid">
        // Map over the enrollments in state to render an article card for each enrollment.
        {items.map((item) => (
          // Each enrollment is presented as an article with a unique key derived from the enrollment id.
          <article className="card" key={item.id}>
            // The course title is rendered as a level-2 heading inside the card.
            <h2>{item.title}</h2>
            // Display the enrollment status (e.g., active, completed) within the card.
            <p>Status: {item.status}</p>
            // A Link to the learning route for this course; clicking navigates to /learn/:id client-side.
            <Link to={`/learn/${item.id}`}>Continue learning</Link>
          </article>
        ))}
      </section>
      // If there are no enrollments and no error, show a friendly empty state message.
      {items.length === 0 && !error && (
        <p>You have not enrolled in a course yet.</p>
      )}
    </main>
  );
}
