// Script name: ProtectedRoute.tsx
// Original location: frontend/src/components/ProtectedRoute.tsx
// What this script is: A React component that enforces authentication and optional role-based authorization for child routes.
// What it is used for: Wraps route content to block unauthenticated or unauthorized access, redirecting or showing an access denied message.
// Programming language: TypeScript with JSX (TSX)
// Inputs: props.children (ReactNode), props.roles? (UserRole[]), authentication context via useAuth()
// Outputs: Renders JSX to the browser (redirect, access denied UI, or the provided children)
// Where output is saved or sent: browser/session storage (rendered to DOM)
// Technologies and services used or interacted with: React, react-router-dom, custom AuthContext hook, TypeScript types
// Downstream scripts/files/processes that consume the output: Route definitions and page components that render ProtectedRoute; any UI expecting redirected or gated content
// Risks and safe change note: Changing auth hook behavior, role checks, or redirect paths can alter access control; ensure unit/integration tests and manual checks for auth flows before modifying.
// created by: Sadeq Obaid

// Import the Navigate component from react-router-dom to perform client-side redirects.
import { Navigate } from 'react-router-dom';
// Import the ReactNode type to type the children prop of the component.
import type { ReactNode } from 'react';
// Import the custom useAuth hook to obtain authentication state (user and loading).
import { useAuth } from '../auth/AuthContext';
// Import the UserRole type to type-check allowed roles passed into the component.
import type { UserRole } from '../types/api';

// Define the ProtectedRoute component that enforces authentication and optional role-based authorization.
// This line begins the exported function declaration and opens the destructured props parameter.
export function ProtectedRoute({
// The 'children' prop represents the React subtree to render when access is permitted.
  children,
// The optional 'roles' prop is an array of UserRole values specifying which roles are allowed.
  roles,
}: {
// The inline type annotation starts here, specifying prop types for the component.
// Type annotation: children must be a ReactNode (anything renderable by React).
  children: ReactNode;
// Type annotation: roles is optional and, when provided, must be an array of UserRole values.
  roles?: UserRole[];
}) {
// Invoke the useAuth hook to retrieve the current authenticated user and the loading flag.
// This call has the side effect of subscribing to auth context and will re-render when auth state changes.
  const { user, loading } = useAuth();
// If the auth state is still being determined, render a short status message and do not proceed.
  if (loading) return <p>Checking your sign-in status…</p>;
// If there is no authenticated user, perform a client-side redirect to the login page and replace history.
  if (!user) return <Navigate to="/login" replace />;
// If a roles array was provided and the current user's role is not included, render an access denied view.
  if (roles && !roles.includes(user.role)) {
    // Begin returning the JSX that represents the access denied message.
    return (
      // Constrain layout width via the "narrow" class for the denial message container.
      <main className="narrow">
        // Heading that clearly states access is denied.
        <h1>Access denied</h1>
        // Paragraph explaining that the signed-in role lacks required permissions.
        <p>Your signed-in role does not have permission to open this workspace.</p>
      </main>
    );
  }
// If loading is false, a user exists, and either no roles were required or the user's role is allowed,
// render the provided children unchanged (wrapped in a Fragment to return a single React node).
  return <>{children}</>;
}
