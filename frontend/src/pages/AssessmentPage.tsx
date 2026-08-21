// Script name: AssessmentPage.tsx
// Original location: frontend/src/AssessmentPage.tsx
// What this script is: React component page that displays an assessment and handles submission
// What it is used for: Fetches assessment data for a course, renders questions and options, posts answers, shows score, and navigates based on result
// Programming language: TypeScript with JSX (TSX)
// Inputs: URL params (courseId, enrollmentId), authenticated token from AuthContext, user form input (selected radio options)
// Outputs: HTTP GET to fetch assessment, HTTP POST to submit answers, browser alert with score, client-side navigation to certificate or learning page
// Where output is saved or sent: HTTP/API (backend endpoints), browser navigation (routes), browser alert; None for filesystem/database directly
// Technologies and services used or interacted with: React, React Router, custom api client, AuthContext, browser alert, backend REST API
// Downstream scripts/files/processes that consume the output: Certificates page (/certificates), Learn page (/learn/:enrollmentId), backend assessment endpoints
// Risks and safe change note: Changing data shapes, API paths, or navigation logic can break flow; ensure token handling and question grouping remain compatible with backend; test after any refactor
// created by: Sadeq Obaid

// Import React hooks useEffect and useState for lifecycle and component state management.
import { useEffect, useState } from 'react';
// Import FormEvent type to type the form submit handler parameter.
import type { FormEvent } from 'react';
// Import navigation and params hooks from react-router-dom to read URL params and programmatically navigate.
import { useNavigate, useParams } from 'react-router-dom';
// Import a typed API client wrapper used to make authenticated HTTP requests to the backend.
import { api } from '../api/client';
// Import authentication context hook to obtain the current user's token for API calls.
import { useAuth } from '../auth/AuthContext';

// Define TypeScript type for the shape of the assessment response returned by the backend.
type AssessmentResponse = {
  // Top-level assessment metadata with id and title.
  assessment: { id: string; title: string };
  // Array of question rows where each entry contains question and option data flattened.
  questions: {
    id: string;
    prompt: string;
    position: number;
    option_id: string;
    option_text: string;
  }[];
};

// Define and export the main React component for the assessment page.
export function AssessmentPage() {
  // Read URL parameters enrollmentId and courseId from the route.
  const { enrollmentId, courseId } = useParams();
  // Obtain the authentication token from context for API authentication.
  const { token } = useAuth();
  // Get navigate function to programmatically change routes after submission.
  const navigate = useNavigate();
  // Local state to hold fetched assessment data or null while loading.
  const [data, setData] = useState<AssessmentResponse | null>(null);
  // Local state to hold any error messages for display.
  const [error, setError] = useState<string | null>(null);
  // Effect hook to fetch assessment data when token or courseId change.
  useEffect(() => {
    // Only attempt fetch when token and courseId are present.
    if (token && courseId)
      // Call the api helper to GET the assessment for the given course, then setData or setError.
      api<AssessmentResponse>(`/courses/${courseId}/assessment`, token)
        .then(setData)
        .catch((err: Error) => setError(err.message));
    // Re-run this effect when token or courseId update.
  }, [token, courseId]);
  // Define the async submit handler for the assessment form.
  async function submit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser's default form submission behavior.
    event.preventDefault();
    // If required context (token, enrollmentId, data) is missing, abort submission early.
    if (!token || !enrollmentId || !data) return;
    // Build a FormData object from the submitted form to read selected option values.
    const form = new FormData(event.currentTarget);
    // Derive unique question IDs from the flattened data.questions array.
    const questionIds = [
      ...new Set(data.questions.map((question) => question.id)),
    ];
    // Map each question ID to an answer object with the selected optionId (string).
    const answers = questionIds.map((questionId) => ({
      questionId,
      optionId: String(form.get(questionId) ?? ''),
    }));
    try {
      // POST the answers to the backend to create an assessment attempt and await the result.
      const result = await api<{
        scorePercent: number;
        passed: boolean;
        certificate: { verification_code: string } | null;
      }>(
        `/enrollments/${enrollmentId}/assessments/${data.assessment.id}/attempts`,
        token,
        { method: 'POST', body: JSON.stringify({ answers }) },
      );
      // Notify the user of their score and pass/fail outcome via browser alert.
      alert(
        `Score: ${result.scorePercent}%. ${result.passed ? 'You passed.' : 'You did not pass yet.'}`,
      );
      // Navigate the user to the certificates page if they received one, otherwise back to the learning page.
      navigate(result.certificate ? '/certificates' : `/learn/${enrollmentId}`);
    } catch (err) {
      // On error, set the error message state for display; normalize non-Error values.
      setError(err instanceof Error ? err.message : 'Submission failed.');
    }
  }
  // If there is an error and no data loaded, render only the error message.
  if (error && !data)
    return (
      <main>
        <p className="error">{error}</p>
      </main>
    );
  // If data has not been loaded yet, render a loading placeholder.
  if (!data)
    return (
      <main>
        <p>Loading assessment…</p>
      </main>
    );
  // Group the flattened question rows into a map keyed by question id with prompt, position, and options.
  const grouped = [
    ...new Map(
      data.questions.map((question) => [
        question.id,
        {
          prompt: question.prompt,
          position: question.position,
          options: data.questions.filter((option) => option.id === question.id),
        },
      ]),
    ).entries(),
  ];
  // Render the assessment title, the form of grouped questions with radio options, and submission button; also show any error.
  return (
    <main>
      <h1>{data.assessment.title}</h1>
      <form onSubmit={submit}>
        {grouped.map(([id, question]) => (
          <fieldset key={id}>
            <legend>
              {question.position}. {question.prompt}
            </legend>
            {question.options.map((option) => (
              <label key={option.option_id}>
                <input
                  type="radio"
                  name={id}
                  value={option.option_id}
                  required
                />
                {option.option_text}
              </label>
            ))}
          </fieldset>
        ))}
        <button>Submit assessment</button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
