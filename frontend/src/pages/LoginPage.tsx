// Script name: LoginPage.tsx
// Original location: frontend/src/pages/LoginPage.tsx
// What this script is: A React functional component implementing the sign-in page UI and logic.
// What it is used for: Renders a login form, handles form submission, calls backend auth API, updates auth context, and navigates on success.
// Programming language: TypeScript with JSX (TSX)
// Inputs: User input from the login form (email and password); React Router and AuthContext provided via app.
// Outputs: Triggers an HTTP API call returning an access token and user object; causes navigation and updates auth state in memory.
// Where output is saved or sent: HTTP/API for authentication; browser navigation and in-memory auth context (no persistent file/database writes here).
// Technologies and services used or interacted with: React, React Router (useNavigate, Link), a custom api client module, AuthContext, backend authentication endpoint (/auth/login).
// Downstream scripts/files/processes that consume the output: AuthContext consumers, protected routes/pages (e.g., workspace, my-courses), other components relying on auth state.
// Risks and safe change note: Changing network request shape, auth token handling, or navigation logic may break login flow; preserve API contract and AuthContext usage when modifying.
// created by: Sadeq Obaid

// Import the useState hook to manage component-local state (error message).
import { useState } from 'react';
// Import the FormEvent type for typing the form submit handler's event parameter.
import type { FormEvent } from 'react';
// Import Link for navigation UI and useNavigate for programmatic navigation after successful login.
import { Link, useNavigate } from 'react-router-dom';
// Import a centralized API client function for making authenticated or unauthenticated HTTP requests.
import { api } from '../api/client';
// Import a hook to access authentication context functions (like login) and state.
import { useAuth } from '../auth/AuthContext';
// Import the User type to correctly type the API response and user object.
import type { User } from '../types/api';

// Export the LoginPage component as a named export; this is the main React component for the page.
export function LoginPage() {
  // Acquire the navigate function for programmatic route changes after login.
  const navigate = useNavigate();
  // Destructure the login function from the auth context to store token/user on successful sign-in.
  const { login } = useAuth();
  // Local state to hold an error string or null; used to display sign-in errors to the user.
  const [error, setError] = useState<string | null>(null);
  // Define the async submit handler for the form; typed to receive an HTML form event.
  async function submit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser's default form submission behavior to handle it with JavaScript.
    event.preventDefault();
    // Clear any previous error message before attempting a new sign-in.
    setError(null);
    // Build a FormData object from the submitted form to read the email and password fields.
    const form = new FormData(event.currentTarget);
    // Try block to handle success path of the authentication request and catch to handle errors.
    try {
      // Call the API client with an expected shape containing accessToken and user; send email/password in request body.
      const result = await api<{ accessToken: string; user: User }>(
        // Endpoint path for login on the backend.
        '/auth/login',
        // No query parameters or special config in this position (null placeholder).
        null,
        {
          // Use HTTP POST to send credentials securely in the request body.
          method: 'POST',
          // JSON stringify the payload extracted from the form data for email and password fields.
          body: JSON.stringify({
            // Get 'email' field value from the FormData; may be FormDataEntryValue type.
            email: form.get('email'),
            // Get 'password' field value from the FormData for authentication.
            password: form.get('password'),
          }),
        },
      );
      // On successful API response, call the AuthContext login function to store token and user in app state.
      login(result.accessToken, result.user);
      // Navigate the user to the appropriate post-login page based on their role.
      navigate(
        // If the user has an admin or instructor role, send them to the workspace; otherwise to their courses.
        ['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR'].includes(result.user.role)
          ? '/workspace'
          : '/my-courses',
      );
    } catch (err) {
      // On any error, set the error state to display a message; use the Error message when possible.
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }
  // Return the JSX that renders the login form, error message, and link to registration.
  return (
    // Main container with a CSS class to constrain width; top-level element for the page.
    <main className="narrow">
      // Heading for the sign-in page.
      <h1>Sign in</h1>
      // Form element wired to the submit handler defined above.
      <form onSubmit={submit}>
        // Label for the email input field, including the input element itself.
        <label>
          // Text label for the email field.
          Email
          // Input element named "email", typed as email and required for browser validation.
          <input name="email" type="email" required />
        </label>
        // Label for the password input field, including the input element itself.
        <label>
          // Text label for the password field.
          Password
          // Input element named "password", typed as password and required for browser validation.
          <input name="password" type="password" required />
        </label>
        // Submit button to trigger form submission and the submit handler.
        <button>Sign in</button>
      </form>
      // Conditional rendering: show a paragraph with the error message when error state is truthy.
      {error && <p className="error">{error}</p>}
      // Paragraph with a link guiding users to the registration page if they need an account.
      <p>
        Need an account? <Link to="/register">Register</Link>.
      </p>
    </main>
  );
}
