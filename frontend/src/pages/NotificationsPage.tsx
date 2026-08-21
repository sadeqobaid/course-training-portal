// Script name: NotificationsPage.tsx
// Original location: frontend/src/pages/NotificationsPage.tsx
// What this script is: A React page component that displays a user's notifications and allows marking them read.
// What it is used for: Fetches notifications from the backend, renders them in the browser, and sends PATCH requests to mark notifications as read.
// Programming language: TypeScript with JSX (TSX)
// Inputs: Authentication token from AuthContext; HTTP responses from the backend /notifications endpoint; user click events.
// Outputs: Renders HTML into the browser UI and issues HTTP/API requests to the backend; no direct filesystem or database writes from this component.
// Where output is saved or sent: Browser UI (rendered DOM); HTTP/API requests to backend endpoints; None for filesystem/database/SMTP/Docker.
// Technologies and services used or interacted with: React (useEffect/useState), custom api client, AuthContext, backend notifications API.
// Downstream scripts/files/processes that consume the output: No direct downstream consumers inside this repo (UI-only); backend will process PATCH updates to notification state.
// Risks and safe change note: Changes to API paths, the Notification type shape, token handling, or optimistic update logic may break UI state or server sync; test API interactions and state updates when modifying. Keep token checks and setItems update logic intact to avoid inconsistent UI.
// created by: Sadeq Obaid

// Import React hooks used for lifecycle and local component state.
import { useEffect, useState } from 'react';
// Import the application's API client helper used to call backend endpoints.
import { api } from '../api/client';
// Import the authentication context hook to obtain the current user's token.
import { useAuth } from '../auth/AuthContext';
// Import the Notification type to type the component state and API responses.
import type { Notification } from '../types/api';

// Export a React component that represents the Notifications page.
export function NotificationsPage() {
  // Retrieve the auth token from context; this token is used for authenticated API calls.
  const { token } = useAuth();
  // Local state holding the list of notifications; initialized as an empty array typed to Notification[].
  const [items, setItems] = useState<Notification[]>([]);
  // Local state holding any error message string from API calls; initialized to null when no error.
  const [error, setError] = useState<string | null>(null);
  // Effect hook to fetch notifications when the component mounts or when the token changes.
  useEffect(() => {
    // Only attempt to fetch if a token is available (user is authenticated).
    if (token)
      // Call the API client to fetch notifications; generic types ensure the response is treated as Notification[].
      api<Notification[]>('/notifications', token)
        // On success, update the local items state with the fetched notifications.
        .then(setItems)
        // On failure, capture the error message into the error state for display.
        .catch((err: Error) => setError(err.message));
    // Depend on token so the effect reruns when authentication changes.
  }, [token]);
  // Define an async helper that marks a specific notification as read by id.
  async function markRead(id: string) {
    // Guard: if there is no token, do nothing (cannot perform authenticated action).
    if (!token) return;
    // Send a PATCH request to the backend to mark this notification as read; await ensures completion before optimistic update.
    await api(`/notifications/${id}/read`, token, { method: 'PATCH' });
    // Update local items state to reflect the read change optimistically: map current items and update the matching id.
    setItems((current) =>
      // Map over current items array to produce a new array with the updated item.
      current.map((item) =>
        // If the current item's id matches the target id, return a new object with status 'READ' and read_at timestamp; otherwise return the item unchanged.
        item.id === id
          ? { ...item, status: 'READ', read_at: new Date().toISOString() }
          : item,
      ),
    );
  }
  // Render the page UI: a main container with header, optional error message, and a list of notification cards.
  return (
    <main>
      <h1>Notifications</h1>
      {/* If there is an error message, render a paragraph with the error text. */}
      {error && <p className="error">{error}</p>}
      {/* Map over items to render an article/card for each notification; key uses item.id for stable identity. */}
      {items.map((item) => (
        <article className="card" key={item.id}>
          {/* Display the notification subject in an h2. */}
          <h2>{item.subject}</h2>
          {/* Display the notification body in a paragraph. */}
          <p>{item.body}</p>
          {/* Display the current status value (e.g., UNREAD/READ). */}
          <p>Status: {item.status}</p>
          {/* If the notification has no read_at timestamp, show a button that triggers markRead when clicked. */}
          {!item.read_at && (
            <button onClick={() => markRead(item.id)}>Mark read</button>
          )}
        </article>
      ))}
    </main>
  );
}
