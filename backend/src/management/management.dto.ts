// Script name: management.dto.ts
// Original location: backend/src/management/management.dto.ts
// What this script is: Data Transfer Object (DTO) definition that describes and validates the shape of announcement creation payloads.
// What it is used for: Used to validate incoming data for creating announcements (enforces types and constraints before service/controller processing).
// Programming language: TypeScript
// Inputs: Incoming announcement payloads (subject: string, body: string, optional recipientRole).
// Outputs: A validated CreateAnnouncementDto instance passed to downstream services/controllers; no direct file/DB output from this file.
// Where output is saved or sent: None
// Technologies and services used or interacted with: TypeScript, class-validator decorators, Node.js/NestJS-style DTO usage patterns.
// Downstream scripts/files/processes that consume the output: API controllers (management controllers), management service layer, notification or persistence handlers that accept validated DTOs.
// Risks and safe change note: Modifying validation decorators, property names, or types will change request validation behavior and may break controllers/services or persistence mappings; update all consumers and tests when changing this file.
// created by: Sadeq Obaid

// Import specific validation decorators from the class-validator library to annotate DTO properties.
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
// Import the UserRole type used to type the optional recipientRole property for stricter typing and downstream checks.
import { UserRole } from '../common/types.js';

// Declare and export the CreateAnnouncementDto class which groups validation rules for announcement creation payloads.
export class CreateAnnouncementDto {
  // Define the 'subject' property as a required string and apply validation: must be a string with minimum length 3 and maximum length 250.
  @IsString() @MinLength(3) @MaxLength(250) subject!: string;
  // Define the 'body' property as a required string and apply validation: must be a string with minimum length 3.
  @IsString() @MinLength(3) body!: string;
  // Apply optional and allowed-value validation to the next property: recipientRole is optional and, if present, must be one of the listed role strings.
  @IsOptional() @IsIn(['LEARNER', 'INSTRUCTOR', 'TRAINING_ADMIN'] as const)
  // Define the 'recipientRole' property as an optional UserRole-typed field; this influences allowed recipients for the announcement.
  recipientRole?: UserRole;
}
