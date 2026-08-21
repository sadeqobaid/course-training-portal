// Script name: RegisterPage.tsx
// Original location: frontend/src/pages/RegisterPage.tsx
// What this script is: A React component that renders a user registration form and handles submission to create a new learner account.
// What it is used for: Collects full name, email, and password from the user, sends them to the backend registration endpoint, and navigates to the login page on success.
// Programming language: TypeScript with JSX (TSX)
// Inputs: User-provided form fields 'fullName', 'email', 'password'; Form submission events; React Router navigation context.
// Outputs: HTTP POST request to backend '/auth/register' endpoint; client-side navigation to '/login'; displays error messages in the UI.
// Where output is saved or sent: HTTP/API (POST to backend '/auth/register'); no filesystem/database writes performed directly by this component.
// Technologies and services used or interacted with: React, react-router-dom, custom api client from frontend/src/api/client, browser form APIs.
// Downstream scripts/files/processes that consume the output: Backend '/auth/register' endpoint consumes the POSTed JSON; the login page ('/login') is navigated to after success; backend-authenticated session handling is downstream.
// Risks and safe change note: Be careful not to log or expose sensitive fields (password); changing JSON shape or field names will break backend integration; ensure server-side validation and HTTPS; avoid swallowing errors silently.
// created by: Sadeq Obaid

// Import the useState hook from React for managing component-local state.
import { useState } from 'react';
// Import the FormEvent type from React to type the submit handler's event parameter.
import type { FormEvent } from 'react';
// Import Link for navigation UI and useNavigate for programmatic navigation from react-router-dom.
import { Link, useNavigate } from 'react-router-dom';
// Import the shared API client helper used to make requests to the backend.
import { api } from '../api/client';

// Export the RegisterPage component as a named export for use in the app's routing.
export function RegisterPage() {
  // Create a navigate function to programmatically change routes after successful registration.
  const navigate = useNavigate();
  // Create a local state variable 'error' to hold any registration error message, initialized to null.
  const [error, setError] = useState<string | null>(null);
  // Define the async form submit handler, typed to receive a HTML form event.
  async function submit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser's default form submission which would reload the page.
    event.preventDefault();
    // Clear any previous error message before attempting a new registration.
    setError(null);
    // Capture the submitted form fields using the FormData API from the form element that triggered the event.
    const form = new FormData(event.currentTarget);
    // Attempt to call the backend API and navigate on success, handling errors in the catch block.
    try {
      // Use the shared api client to POST registration data to the backend; await ensures we wait for completion.
      await api('/auth/register', null, {
        // Specify HTTP method POST for creating a new account.
        method: 'POST',
        // Send the request body as JSON containing email, password, and fullName taken from the FormData.
        body: JSON.stringify({
          // Retrieve the 'email' field value from the FormData and include it in the JSON payload.
          email: form.get('email'),
          // Retrieve the 'password' field value from the FormData and include it in the JSON payload.
          password: form.get('password'),
          // Retrieve the 'fullName' field value from the FormData and include it in the JSON payload.
          fullName: form.get('fullName'),
        }),
      });
      // After successful registration, navigate the user to the login page.
      navigate('/login');
    } catch (err) {
      // On error, set the error state to the error message if available, otherwise a generic message.
      setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  }
  // Return the JSX markup for the registration page: form fields, submit button, conditional error, and link to login.
  return (
    // Main wrapper element with a "narrow" class for layout styling.
    <main className="narrow">
      // Page heading indicating purpose of the page.
      <h1>Create learner account</h1>
      // The form element binds its onSubmit handler to the submit function defined above.
      <form onSubmit={submit}>
        // Label for the full name input field grouping text and input together.
        <label>
          // Visible text label for the full name input.
          Full name
          // Input for 'fullName' with a minimum length of 2 characters and marked required.
          <input name="fullName" minLength={2} required />
        </label>
        // Label for the email input field grouping text and input together.
        <label>
          // Visible text label for the email input.
          Email
          // Input for 'email' with HTML5 email validation and marked required.
          <input name="email" type="email" required />
        </label>
        // Label for the password input field grouping text and input together.
        <label>
          // Visible text label for the password input.
          Password
          // Input for 'password' with type password, minimum length 8, and marked required.
          <input name="password" type="password" minLength={8} required />
        </label>
        // Submit button for creating the account; browser will trigger form submission when clicked.
        <button>Create account</button>
      </form>
      // Conditionally render a paragraph with the error message if the error state is truthy.
      {error && <p className="error">{error}</p>}
      // Paragraph providing a link for users who are already registered to go to the sign-in page.
      <p>
        // Inline Link component routes to the '/login' page without a full page reload.
        Already registered? <Link to="/login">Sign in</Link>.
      </p>
    </main>
  );
}
