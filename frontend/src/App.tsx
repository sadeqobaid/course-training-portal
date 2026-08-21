// Script name: App.tsx
// Original location: frontend/src/App.tsx
// What this script is: Root React application component that defines routing and layout.
// What it is used for: Sets up client-side routes, wraps pages with authentication guards, and renders common UI (NavBar, footer).
// Programming language: TypeScript with JSX (TSX)
// Inputs: React Router URL path, user authentication/role state via ProtectedRoute and components' own props/state.
// Outputs: Renders React elements to the browser DOM (no direct file or DB output).
// Where output is saved or sent: browser/session storage
// Technologies and services used or interacted with: React, React Router (react-router-dom), application-specific components (NavBar, ProtectedRoute, page components).
// Downstream scripts/files/processes that consume the output: index.tsx (or equivalent entry) mounts this component; individual page components consume routing props and render content.
// Risks and safe change note: Modifying routes, auth guards, or role lists can change access control and navigation; ensure tests and integration with authentication are updated when changing routes or ProtectedRoute usage.
// created by: Sadeq Obaid

// Import routing primitives from react-router-dom which are used below to declare navigation structure and route handling.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
// Import top-level navigation bar component that is rendered on every page.
import { NavBar } from './components/NavBar';
// Import a wrapper component that enforces authentication and optional role-based access for protected routes.
import { ProtectedRoute } from './components/ProtectedRoute';
// Import page components mapped to different routes; each renders a distinct screen.
import { CataloguePage } from './pages/CataloguePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { LearningPage } from './pages/LearningPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminPage } from './pages/AdminPage';

// Export the main App component which composes routing and top-level layout for the SPA.
export function App() {
  // Return the application JSX tree: a BrowserRouter wrapping the shell, NavBar, main content area with route definitions, and footer.
  return (
    // BrowserRouter provides HTML5 history-based routing context for all nested Route elements.
    <BrowserRouter>
      // Top-level container for layout styling; wraps NavBar, main content, and footer.
      <div className="app-shell">
        // Renders the site navigation bar at the top of the layout; typically contains links and auth controls.
        <NavBar />
        // Main content region where route-matched pages are rendered.
        <main className="app-content">
          // Routes defines a set of Route elements that map paths to React elements/components.
          <Routes>
            // Route for the root path, renders the catalogue page listing available courses.
            <Route path="/" element={<CataloguePage />} />
            // Route for user registration, renders the registration form/page.
            <Route path="/register" element={<RegisterPage />} />
            // Route for user login, renders the login form/page.
            <Route path="/login" element={<LoginPage />} />
            // Route for course details; :id is a URL parameter passed to CourseDetailPage.
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            // Protected route for viewing the user's enrolled courses; requires authentication.
            <Route
              path="/my-courses"
              element={
                // ProtectedRoute enforces authentication and wraps the MyCoursesPage component.
                <ProtectedRoute>
                  // The page component showing courses the current user is enrolled in.
                  <MyCoursesPage />
                </ProtectedRoute>
              }
            />
            // Protected route for the learning experience; :enrollmentId is a URL parameter identifying the enrollment.
            <Route
              path="/learn/:enrollmentId"
              element={
                // Protect access to the learning page so only authenticated users can access content.
                <ProtectedRoute>
                  // LearningPage provides the interactive learning UI for a specific enrollment.
                  <LearningPage />
                </ProtectedRoute>
              }
            />
            // Protected route for assessments; URL includes enrollment and course identifiers.
            <Route
              path="/assessment/:enrollmentId/:courseId"
              element={
                // Enforce authentication before allowing access to assessment workflows.
                <ProtectedRoute>
                  // AssessmentPage handles quizzes/tests for a particular enrollment and course.
                  <AssessmentPage />
                </ProtectedRoute>
              }
            />
            // Protected route to list or manage certificates for the authenticated user.
            <Route
              path="/certificates"
              element={
                // Certificates are sensitive and require authentication to view/download.
                <ProtectedRoute>
                  // CertificatesPage renders available certificates and related actions.
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />
            // Protected route for user notifications; only authenticated users can view their notifications.
            <Route
              path="/notifications"
              element={
                // Wrap notifications page to enforce that user is logged in.
                <ProtectedRoute>
                  // NotificationsPage shows alerts/messages relevant to the user.
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            // Protected admin/workspace route limited to specific roles passed as a prop to ProtectedRoute.
            <Route
              path="/workspace"
              element={
                // ProtectedRoute receives a roles array to restrict access to administrative roles.
                <ProtectedRoute roles={['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR']}>
                  // AdminPage provides administrative workspace functionality for authorized roles.
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            // Redirect route: legacy /admin path is redirected to /workspace to centralize admin UI.
            <Route path="/admin" element={<Navigate to="/workspace" replace />} />
            // Catch-all route: any unmatched path will render the catalogue page as a fallback.
            <Route path="*" element={<CataloguePage />} />
          </Routes>
        </main>
        // Footer displayed across the site; contains author credit text.
        <footer className="site-footer">Created by Sadeq Obaid</footer>
      </div>
    </BrowserRouter>
  );
}
