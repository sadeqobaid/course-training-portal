// Script name: types.ts
// Original location: backend/src/common/types.ts
// What this script is: TypeScript module exporting user role constants and authentication-related type definitions.
// What it is used for: Provides canonical role string constants and TypeScript types for authenticated users and JWT payloads consumed across the backend for authorization and type safety.
// Programming language: TypeScript
// Inputs: None (pure type/constants module)
// Outputs: None (exports type information and constants for import by other modules)
// Where output is saved or sent: None
// Technologies and services used or interacted with: TypeScript, Node.js runtime; used by authentication/authorization middleware and services, possibly JWT libraries at runtime.
// Downstream scripts/files/processes that consume the output: Auth middleware, controllers, services, type-checked modules importing these constants/types, tests.
// Risks and safe change note: Changing role names or type shapes can break runtime authorization logic and compile-time type checking across the codebase; coordinate changes with all consuming modules and update migrations/tests accordingly.
// created by: Sadeq Obaid

// Define a readonly tuple of allowed user role string constants used for compile-time and runtime role checks.
export const USER_ROLES = [
  // Role name for system-level administrators with full privileges.
  'SYSTEM_ADMIN',
  // Role name for training administrators who manage courses and training resources.
  'TRAINING_ADMIN',
  // Role name for instructors who deliver content and manage learners.
  'INSTRUCTOR',
  // Role name for regular learners consuming training content.
  'LEARNER',
] as const;
// Create a union type from the USER_ROLES tuple so UserRole is one of the literal role strings.
export type UserRole = (typeof USER_ROLES)[number];

// Define shape of an authenticated user object passed around request/session contexts and services.
export type AuthenticatedUser = {
  // Unique identifier for the user (e.g., UUID or database id).
  id: string;
  // User's email address used for authentication and contact.
  email: string;
  // User's full display name.
  fullName: string;
  // The user's role constrained to the UserRole union defined above.
  role: UserRole;
  // Flag indicating whether the user's account is active; used in access decisions.
  isActive: boolean;
};
// Define the expected JWT payload structure used for authentication/authorization: subject id, role, and email.
export type JwtPayload = { sub: string; role: UserRole; email: string };
