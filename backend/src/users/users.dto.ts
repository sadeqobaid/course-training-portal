// Script name: users.dto.ts
// Original location: backend/src/users/users.dto.ts
// What this script is: DTO definitions with validation decorators for user-related payloads
// What it is used for: To declare typed Data Transfer Objects and attach validation rules for creating and updating managed users
// Programming language: TypeScript
// Inputs: Incoming request payloads (typically JSON) that are mapped to these DTO classes
// Outputs: Validated DTO instances (typed objects) returned to request handling/service code; no direct persistence performed here
// Where output is saved or sent: None
// Technologies and services used or interacted with: class-validator for runtime validation; local type definitions in ../common/types.js
// Downstream scripts/files/processes that consume the output: controllers, services, and request handlers that create or update users
// Risks and safe change note: Modifying validation decorators or types can break request acceptance rules and downstream business logic; change carefully and add tests
// created by: Sadeq Obaid

// Import validation decorators and constraints from the class-validator package; this whole import block brings multiple named exports into scope for use on DTO properties.
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
// Import local constants/types that describe allowed user roles and the UserRole type from the project's common types module.
import { USER_ROLES, UserRole } from '../common/types.js';

// Export a DTO class used when creating a managed user; class-validator decorators on properties declare validation rules applied at runtime.
export class CreateManagedUserDto {
  // Apply email validation to the 'email' property and declare its TypeScript type; this property is required (non-optional) and uses definite assignment assertion.
  @IsEmail() email!: string;
  // Apply string, min-length, and max-length validations to the 'fullName' property and declare its type; ensures human name length constraints.
  @IsString() @MinLength(2) @MaxLength(200) fullName!: string;
  // Apply string and minimum length validation to the 'password' property and declare its type; enforces password minimum length.
  @IsString() @MinLength(10) password!: string;
  // Validate that 'role' is one of the allowed USER_ROLES values and type it as UserRole; required role selection for the managed user.
  @IsIn(USER_ROLES) role!: UserRole;
}

// Export a DTO class used when updating a managed user; properties are optional and decorated to allow partial updates with validation.
export class UpdateManagedUserDto {
  // Optional role field for updates; when present it must be one of USER_ROLES and is typed as UserRole.
  @IsOptional() @IsIn(USER_ROLES) role?: UserRole;
  // Optional boolean flag indicating whether the user is active; validated as boolean when provided.
  @IsOptional() @IsBoolean() isActive?: boolean;
}
