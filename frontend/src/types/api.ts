// Script name: api.ts
// Original location: frontend/src/types/api.ts
// What this script is: TypeScript type declarations for API-related domain entities.
// What it is used for: Defines compile-time types for users, courses, lessons, enrollments, notifications, certificates, managed entities, and API errors to shape data exchanged with backend APIs.
// Programming language: TypeScript
// Inputs: None (type definitions only, no runtime inputs).
// Outputs: Type declarations used by the TypeScript compiler; no runtime output.
// Where output is saved or sent: None
// Technologies and services used or interacted with: TypeScript, frontend codebase, HTTP APIs (implied), no direct runtime integrations.
// Downstream scripts/files/processes that consume the output: Frontend components, API clients, reducers, and other TypeScript files that import these types.
// Risks and safe change note: Changing types can break compile-time checks and runtime assumptions across the app; update all consumers and tests when modifying fields or names.
// created by: Sadeq Obaid

// Export an aliased type named UserRole to represent allowed role string literals across the app.
export type UserRole =
  // Allowed role: system administrator with broad privileges.
  | 'SYSTEM_ADMIN'
  // Allowed role: training administrator responsible for course management.
  | 'TRAINING_ADMIN'
  // Allowed role: instructor who teaches or manages lessons.
  | 'INSTRUCTOR'
  // Allowed role: learner or student taking courses.
  | 'LEARNER';

// Export a User type describing the shape of user objects returned or sent to APIs.
export type User = {
  // Unique identifier for the user.
  id: string;
  // Email address for the user.
  email: string;
  // Full display name for the user.
  fullName: string;
  // Role of the user constrained by the UserRole union above.
  role: UserRole;
  // Boolean flag indicating whether the user account is active.
  isActive: boolean;
};
// Export a Course type defining the structure of course entities exchanged with the backend.
export type Course = {
  // Unique course identifier.
  id: string;
  // Human-readable title of the course.
  title: string;
  // URL-friendly identifier for the course.
  slug: string;
  // Brief description of the course.
  description: string;
  // Learning objectives for the course, stored as a string.
  objectives: string;
  // Prerequisites required before taking the course.
  prerequisites: string;
  // Current lifecycle status of the course (e.g., draft, published).
  status: string;
  // Passing score percentage represented as a string (e.g., "80").
  passing_score_percent: string;
  // Timestamp string when the course was published or null if unpublished.
  published_at: string | null;
};
// Export a Lesson type that models lessons belonging to courses.
export type Lesson = {
  // Unique lesson identifier.
  id: string;
  // Identifier of the course this lesson belongs to.
  course_id: string;
  // Title of the lesson.
  title: string;
  // Lesson content in markdown format.
  body_markdown: string;
  // Ordering position of the lesson within the course.
  position: number;
  // Flag indicating whether the lesson is published.
  is_published: boolean;
};
// Export an Enrollment type representing a learner's enrollment in a course.
export type Enrollment = {
  // Unique enrollment identifier.
  id: string;
  // Identifier of the learner (user) enrolled.
  learner_id: string;
  // Identifier of the associated course.
  course_id: string;
  // Enrollment status (e.g., active, completed).
  status: string;
  // Timestamp when the enrollment occurred.
  enrolled_at: string;
  // Timestamp when the enrollment was completed or null if not completed.
  completed_at: string | null;
  // Optional title cached on enrollment for display purposes.
  title?: string;
  // Optional description cached on enrollment for display purposes.
  description?: string;
};
// Export a Notification type modeling system notifications delivered to users.
export type Notification = {
  // Unique notification identifier.
  id: string;
  // Type/category of notification.
  notification_type: string;
  // Short subject line of the notification.
  subject: string;
  // Body content of the notification.
  body: string;
  // Current status of the notification (e.g., sent, failed).
  status: string;
  // Creation timestamp of the notification.
  created_at: string;
  // Read timestamp or null if unread.
  read_at: string | null;
};
// Export a Certificate type capturing issued certificate metadata.
export type Certificate = {
  // Public certificate number shown to recipients.
  certificate_number: string;
  // Verification code used to verify authenticity.
  verification_code: string;
  // Issuance timestamp of the certificate.
  issued_at: string;
  // Title/name to display on the certificate.
  title: string;
};
// Export a ManagedCourse type used for administrative/course-management views.
export type ManagedCourse = {
  // Unique identifier for the managed course.
  id: string;
  // Title of the managed course.
  title: string;
  // URL slug for the managed course.
  slug: string;
  // Lifecycle status of the managed course.
  status: string;
  // Identifier or name of the creator/owner.
  created_by: string;
  // Number of lessons represented as a string (consistent with backend shape).
  lesson_count: string;
  // Number of assessments represented as a string.
  assessment_count: string;
  // Number of enrollments represented as a string.
  enrollment_count: string;
  // Number of completions represented as a string.
  completed_count: string;
};
// Export a ManagedUser type tailored for administrative user listings and audits.
export type ManagedUser = {
  // Unique user identifier.
  id: string;
  // Email address of the managed user.
  email: string;
  // Full name field uses snake_case in this managed view.
  full_name: string;
  // Role of the managed user using the UserRole union.
  role: UserRole;
  // Active flag in snake_case for consistency with backend payloads.
  is_active: boolean;
  // Timestamp string when the managed user was created.
  created_at: string;
};
// Export an ApiError type modeling error responses from backend APIs.
export type ApiError = {
  // HTTP-style status code for the error.
  statusCode: number;
  // Message(s) describing the error; can be a single string or an array.
  message: string | string[];
  // Optional request identifier returned by backend for tracing.
  requestId?: string;
  // Optional timestamp string when the error occurred.
  timestamp?: string;
};
