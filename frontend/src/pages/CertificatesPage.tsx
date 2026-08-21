// Script name: CertificatesPage.tsx
// Original location: frontend/src/pages/CertificatesPage.tsx
// What this script is: React component page for displaying the current user's certificates.
// What it is used for: Fetches certificates for the authenticated user and renders them as a list of cards.
// Programming language: TypeScript with JSX (TSX)
// Inputs: authentication token from AuthContext; HTTP response payload from GET /certificates/me
// Outputs: rendered JSX to the browser DOM (visual list of certificates and possible error message)
// Where output is saved or sent: None
// Technologies and services used or interacted with: React (hooks), custom api client (HTTP), AuthContext for auth token, browser Date formatting
// Downstream scripts/files/processes that consume the output: other UI components or pages may link to this page; no file or DB persistence from this component
// Risks and safe change note: Modifying API endpoint, token handling, or certificate fields may break rendering or data fetch; keep types and token usage intact and test authenticated/unauthenticated flows and error states before deployment.
// created by: Sadeq Obaid

// Import React hooks used for lifecycle and state management in the component.
import { useEffect, useState } from 'react';
// Import the typed API client helper used to perform authenticated HTTP requests.
import { api } from '../api/client';
// Import the authentication context hook to obtain the current user's token.
import { useAuth } from '../auth/AuthContext';
// Import the Certificate type definition for strong typing of fetched data.
import type { Certificate } from '../types/api';

// Define and export the CertificatesPage React component as a function.
export function CertificatesPage() {
  // Retrieve the authentication token from the AuthContext to authorize API requests.
  const { token } = useAuth();
  // Local state holding an array of Certificate objects fetched from the server; initialized empty.
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  // Local state holding an error message string when an API call fails; initialized null (no error).
  const [error, setError] = useState<string | null>(null);
  // Effect hook that triggers fetching certificates when the token value changes.
  useEffect(() => {
    // Only perform the API call if a token is available (user is authenticated).
    if (token)
      // Call the API client for the /certificates/me endpoint, typed to return Certificate[]; pass token for auth.
      api<Certificate[]>('/certificates/me', token)
        // On successful response, update the certificates state with the returned array.
        .then(setCertificates)
        // On error, capture the Error message and store it in the error state for display.
        .catch((err: Error) => setError(err.message));
  // Depend on token so this effect re-runs when authentication state changes.
  }, [token]);
  // Return the JSX structure that renders the page UI including error and certificates list.
  return (
    // Main semantic container for the page content.
    <main>
      // Page heading that labels the section as the user's certificates.
      <h1>My certificates</h1>
      // Conditionally render an error paragraph if an error message exists in state.
      {error && <p className="error">{error}</p>}
      // Section element with a grid class that will contain certificate cards.
      <section className="grid">
        // Map over the certificates array to produce a card article for each certificate item.
        {certificates.map((certificate) => (
          // Article element styled as a card; use certificate_number as the React key to uniquely identify items.
          <article className="card" key={certificate.certificate_number}>
            // Certificate title displayed prominently per card.
            <h2>{certificate.title}</h2>
            // Display the certificate number as descriptive text.
            <p>Certificate number: {certificate.certificate_number}</p>
            // Format the issued_at timestamp into a locale-aware string for readability.
            <p>Issued: {new Date(certificate.issued_at).toLocaleString()}</p>
            // Show the verification code associated with this certificate.
            <p>Verification code: {certificate.verification_code}</p>
          </article>
        ))}
      </section>
      // If there are no certificates and no error, show a fallback message informing the user none have been issued.
      {certificates.length === 0 && !error && (
        <p>No certificate has been issued yet.</p>
      )}
    </main>
  );
}
