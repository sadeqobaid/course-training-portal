export const USER_ROLES = [
  'SYSTEM_ADMIN',
  'TRAINING_ADMIN',
  'INSTRUCTOR',
  'LEARNER',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

export type JwtPayload = { sub: string; role: UserRole; email: string };
