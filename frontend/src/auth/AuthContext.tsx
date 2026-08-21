// Script name: AuthContext.tsx
// Original location: frontend/src/auth/AuthContext.tsx
// What this script is: React context provider and hook for authentication state management
// What it is used for: Stores and exposes auth token, current user, loading state, and login/logout helpers to React components
// Programming language: TypeScript (TSX)
// Inputs: token from localStorage, API responses from ../api/client, children prop passed to AuthProvider
// Outputs: React context value (token, user, loading, login, logout); side effects to localStorage and outgoing HTTP/API requests
// Where output is saved or sent: browser/session storage (localStorage), HTTP/API calls via internal api client
// Technologies and services used or interacted with: React (hooks & context), browser localStorage, internal API client (../api/client), TypeScript types
// Downstream scripts/files/processes that consume the output: React components that call useAuth() or consume AuthContext.Provider value
// Risks and safe change note: Modifying the TOKEN_KEY, removal logic, or async fetch flow may break authentication; ensure changes handle race conditions, SSR/rehydration, and error cases; test in integration
// created by: Sadeq Obaid

// Import React functions and hooks used for creating and consuming context and managing side effects/state.
import { createContext, useContext, useEffect, useState } from 'react';
// Import the ReactNode type used for typing the children prop of the provider component.
import type { ReactNode } from 'react';
// Import the API client function used to fetch authenticated user information from the server.
import { api } from '../api/client';
// Import the User type which describes the shape of the authenticated user object.
import type { User } from '../types/api';

// Define the shape of the authentication context value exposed to consumers.
type AuthContextValue = {
  // The JWT or access token string, or null when not authenticated.
  token: string | null;
  // The currently authenticated user, or null when unknown/not authenticated.
  user: User | null;
  // Whether the provider is currently loading authentication state (e.g., fetching /auth/me).
  loading: boolean;
  // Function to perform login: accepts token and user then stores/updates state.
  login: (token: string, user: User) => void;
  // Function to perform logout: clears token and user state and storage.
  logout: () => void;
};

// Create a React context typed with AuthContextValue or undefined before provider initialization.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
// Key used to persist the access token in browser localStorage.
const TOKEN_KEY = 'course-training-portal.access-token';

// Exported provider component that wraps application parts needing auth state.
// It accepts children React nodes and supplies the AuthContext value to descendants.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize token state lazily by reading from localStorage to avoid doing it on every render.
  const [token, setToken] = useState<string | null>(() =>
    // Retrieve the persisted token string from localStorage using TOKEN_KEY; may be null if not present.
    localStorage.getItem(TOKEN_KEY),
  );
  // Initialize user state to null until we fetch or set a user object.
  const [user, setUser] = useState<User | null>(null);
  // Initialize loading state to true to indicate initial auth state determination is in progress.
  const [loading, setLoading] = useState(true);

  // Effect to fetch the authenticated user's data whenever the token changes.
  useEffect(() => {
    // If there is no token, there is nothing to fetch; mark loading as finished and exit.
    if (!token) {
      setLoading(false);
      return;
    }
    // Call the API client to fetch current user information from the /auth/me endpoint using the token.
    api<{ user: User }>('/auth/me', token)
      // On successful response, extract and set the user state from the returned result.
      .then((result) => setUser(result.user))
      // On error (e.g., invalid/expired token), clear persisted token and reset relevant state.
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      // After success or failure, ensure loading is set to false to indicate completion.
      .finally(() => setLoading(false));
  }, [token]);

  // Construct the context value object that will be provided to consumers.
  const value: AuthContextValue = {
    // Current token value from state.
    token,
    // Current user value from state.
    user,
    // Current loading status from state.
    loading,
    // Login function: persists the token, updates token state, and sets the user state.
    login: (newToken, newUser) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(newUser);
    },
    // Logout function: removes token from storage and clears token and user from state.
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    },
  };
  // Render the AuthContext.Provider with the computed value and pass through children.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to consume the AuthContext and return its value, enforcing provider usage.
export function useAuth(): AuthContextValue {
  // Retrieve the context value using React's useContext.
  const context = useContext(AuthContext);
  // If no context is available, the hook was called outside of the provider; throw an error to help developers.
  if (!context) throw new Error('useAuth must be called inside AuthProvider.');
  // Return the non-null context value to the caller.
  return context;
}
