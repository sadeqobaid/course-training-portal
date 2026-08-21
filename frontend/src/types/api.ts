export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'TRAINING_ADMIN'
  | 'INSTRUCTOR'
  | 'LEARNER';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};
export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  objectives: string;
  prerequisites: string;
  status: string;
  passing_score_percent: string;
  published_at: string | null;
};
export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  body_markdown: string;
  position: number;
  is_published: boolean;
};
export type Enrollment = {
  id: string;
  learner_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  title?: string;
  description?: string;
};
export type Notification = {
  id: string;
  notification_type: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  read_at: string | null;
};
export type Certificate = {
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  title: string;
};
export type ManagedCourse = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_by: string;
  lesson_count: string;
  assessment_count: string;
  enrollment_count: string;
  completed_count: string;
};
export type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};
export type ApiError = {
  statusCode: number;
  message: string | string[];
  requestId?: string;
  timestamp?: string;
};
