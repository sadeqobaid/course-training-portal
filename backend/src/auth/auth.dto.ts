// Script name: auth.dto.ts
// Original location: backend/src/auth/auth.dto.ts
// What this script is: Data Transfer Object (DTO) definitions for authentication payloads
// What it is used for: Defines and validates the shape of incoming auth-related request bodies (register and login)
// Programming language: TypeScript
// Inputs: HTTP request bodies (typically JSON) for registration and login endpoints
// Outputs: In-memory validated DTO instances (typed objects) used by controllers/services
// Where output is saved or sent: None
// Technologies and services used or interacted with: class-validator, TypeScript, Node.js, NestJS (typical framework usage)
// Downstream scripts/files/processes that consume the output: auth controllers, auth service, request validation pipeline, any controllers that accept RegisterDto/LoginDto
// Risks and safe change note: Changing validation rules, property names, or types can break authentication flows and cause runtime validation failures; update dependent controllers/services and tests when modifying.
// created by: Sadeq Obaid

// Import specific validation decorators from the class-validator package used to annotate DTO properties.
import { IsEmail, IsString, MinLength } from 'class-validator';

// Define a DTO class for the registration request payload; used to type-check and validate incoming data.
export class RegisterDto {
  // Apply an email-format validation decorator to the following property to enforce RFC-compliant emails.
  @IsEmail()
  // Declare the email property as a required string on the DTO; the definite assignment '!' indicates it will be provided at runtime.
  email!: string;

  // Apply a string-type validation to the following property to ensure the value is a string.
  @IsString()
  // Apply a minimum length constraint to the following property to enforce password length (8 characters).
  @MinLength(8)
  // Declare the password property with string type and definite assignment assertion; validated by the preceding decorators.
  password!: string;

  // Apply a string-type validation to the following property to ensure the value is a string.
  @IsString()
  // Apply a minimum length constraint to the following property to enforce a minimal full name length (2 characters).
  @MinLength(2)
  // Declare the fullName property with string type and definite assignment assertion; validated by the preceding decorators.
  fullName!: string;
  // End of RegisterDto class definition.
}

// Define a DTO class for the login request payload; used to type-check and validate incoming data.
export class LoginDto {
  // Apply an email-format validation decorator to the following property to enforce RFC-compliant emails.
  @IsEmail()
  // Declare the email property as a required string on the DTO; the definite assignment '!' indicates it will be provided at runtime.
  email!: string;

  // Apply a string-type validation to the following property to ensure the value is a string.
  @IsString()
  // Apply a minimum length constraint to the following property to enforce password length (at least 1 character).
  @MinLength(1)
  // Declare the password property with string type and definite assignment assertion; validated by the preceding decorators.
  password!: string;
  // End of LoginDto class definition.
}
