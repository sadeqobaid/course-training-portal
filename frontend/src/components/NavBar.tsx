// Script name: NavBar.tsx
// Original location: frontend/src/components/NavBar.tsx
// What this script is: A React functional component that renders the application's top navigation bar.
// What it is used for: Displays navigation links based on authentication state and user role, and provides sign-in/sign-out flows.
// Programming language: TypeScript with JSX (TSX)
// Inputs: React context from useAuth (user, logout) and react-router hook useNavigate; no direct function parameters.
// Outputs: JSX UI rendered to the browser DOM (no direct return value other than React element).
// Where output is saved or sent: browser/session storage: None; database/table: None; filesystem path: None; JSON: None; HTTP/API: None; SMTP: None; Docker service: None; console: None
// Technologies and services used or interacted with: React, react-router-dom, project AuthContext.
// Downstream scripts/files/processes that consume the output: React renderer in the application mounting point; any parent components that include NavBar.
// Risks and safe change note: Changing rendering logic, role checks, or navigation side effects may alter auth flow and available links for users; ensure role strings and route paths remain consistent with backend and app routing; test cross-role navigation and sign-out behavior after edits.
// created by: Sadeq Obaid

// Import Link and useNavigate from react-router-dom to create navigation links and perform programmatic navigation.
import { Link, useNavigate } from 'react-router-dom';
// Import the useAuth hook from the application's AuthContext to access the current user and logout function.
import { useAuth } from '../auth/AuthContext';

// Declare and export the NavBar component as a named export so other parts of the app can import it.
export function NavBar() {
  // Destructure user and logout from the authentication context; user determines which links to show, logout is called on sign-out.
  const { user, logout } = useAuth();
  // Initialize navigate function from react-router to perform route changes programmatically (used after logout).
  const navigate = useNavigate();
  // Return the JSX structure for the navigation bar; this is the React element rendered to the DOM.
  return (
    // Top-level header element with CSS class "nav" that contains branding and navigation links.
    <header className="nav">
      // Brand link that navigates to the root path; visually represents the application title.
      <Link to="/" className="brand">
        // Visible text inside the brand link.
        Course Training Portal
      </Link>
      // Navigation container that holds the various links and conditional elements based on authentication/roles.
      <nav>
        // Always-visible link to the course catalogue at the root path.
        <Link to="/">Catalogue</Link>
        // Conditionally render "My courses" link only when a user is authenticated (truthy user).
        {user && <Link to="/my-courses">My courses</Link>}
        // Conditionally render "Notifications" link only when authenticated.
        {user && <Link to="/notifications">Notifications</Link>}
        // Conditionally render "Certificates" link only when authenticated.
        {user && <Link to="/certificates">Certificates</Link>}
        // Conditionally render workspace link when user is authenticated AND their role is one of the defined admin/instructor roles.
        {user && ['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR'].includes(user.role) && (
          // Link to the workspace area; label inside is determined by the user's role.
          <Link to="/workspace">
            // Ternary nested expressions to select the human-readable workspace label based on exact user.role string.
            {user.role === 'SYSTEM_ADMIN'
              ? 'System administration'
              : user.role === 'TRAINING_ADMIN'
                ? 'Training workspace'
                : 'Instructor workspace'}
          </Link>
        )}
        // If there is an authenticated user, render a sign-out button; otherwise render links to login and register.
        {user ? (
          // Button that triggers logout and redirects to the root path when clicked.
          <button className="nav-signout"
            // onClick handler performs side effects: calls logout from auth context and navigates to the homepage.
            onClick={() => {
              // Call logout to clear user session/auth state.
              logout();
              // Programmatically navigate back to the homepage after logging out.
              navigate('/');
            }}
          >
            // Button label shown to users to sign out.
            Sign out
          </button>
        ) : (
          // When no user is present, render fragment containing sign-in and register links.
          <>
            // Link to the login page to allow users to sign in.
            <Link to="/login">Sign in</Link>
            // Link to the registration page to allow new users to create an account.
            <Link to="/register">Register</Link>
          </>
        )}
        // If a user is authenticated, show a role badge by replacing underscores in the role string with spaces for readability.
        {user && <span className="role-badge">{user.role.replaceAll('_', ' ')}</span>}
      </nav>
    </header>
  );
}
