// Script name: main.tsx
// Original location: frontend/src/main.tsx
// What this script is: Application entry point that bootstraps the React single-page application and mounts the root component tree.
// What it is used for: Locates the HTML root element, creates the React root, and renders the app wrapped in StrictMode and an authentication context provider.
// Programming language: TypeScript with JSX (TSX)
// Inputs: DOM (document.getElementById('root')), imported modules and side-effect CSS import
// Outputs: Renders UI into the browser DOM (no file or network output from this script itself)
// Where output is saved or sent: browser/session storage (rendered DOM/UI in the page)
// Technologies and services used or interacted with: React, React DOM (react-dom/client), application components (App), authentication context (AuthProvider), CSS import
// Downstream scripts/files/processes that consume the output: Application components mounted under the root (App and any children), browser event handlers and routes within the SPA
// Risks and safe change note: Changing the root element id, removing StrictMode, or altering AuthProvider can change runtime behavior and mask development-only warnings; ensure DOM contains #root and test UI rendering after edits.
// created by: Sadeq Obaid

// Import React's StrictMode wrapper for highlighting potential problems in the component tree during development.
import { StrictMode } from 'react';
// Import the new React 18+ createRoot function to mount the app into a DOM container.
import { createRoot } from 'react-dom/client';
// Import the top-level App component which is the root of the application's component tree.
import { App } from './App';
// Import the AuthProvider which supplies authentication context to the app; this is a context provider component.
import { AuthProvider } from './auth/AuthContext';
// Import global styles via a side-effect import so the bundler includes the CSS in the build.
import './styles.css';

// Retrieve the DOM element with id 'root' to serve as the mounting point for the React application.
const rootElement = document.getElementById('root');
// Guard: if the root element is missing, throw an error to stop initialization and surface a clear failure.
if (!rootElement) throw new Error('The HTML root element does not exist.');

// Create a React root tied to the DOM element and render the component tree composed of StrictMode, AuthProvider, and App.
// This call produces side effects on the page by updating the DOM; the tree ensures development checks and authentication context are applied.
createRoot(rootElement).render(
  // Render in StrictMode to enable additional checks and warnings during development; this wraps the component tree.
  <StrictMode>
    // Wrap the application in AuthProvider so child components can access authentication state via context.
    <AuthProvider>
      // Mount the App component, which defines the application's UI, routes, and child components.
      <App />
    // Close AuthProvider to complete the provider wrapper around App.
    </AuthProvider>
  // Close StrictMode to finish the development-only checks wrapper.
  </StrictMode>,
);
