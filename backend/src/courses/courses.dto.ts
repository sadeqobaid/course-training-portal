// Script name: courses.dto.ts
// Original location: backend/src/courses/courses.dto.ts
// What this script is: Data Transfer Object (DTO) class definitions for courses and lessons using validation decorators
// What it is used for: Defines shape and validation rules for incoming course and lesson payloads in request handling
// Programming language: TypeScript
// Inputs: Runtime input objects (e.g., HTTP request bodies) mapped to these DTO classes
// Outputs: Validated DTO instances or validation errors
// Where output is saved or sent: None
// Technologies and services used or interacted with: class-validator (validation decorators), TypeScript, potentially NestJS framework
// Downstream scripts/files/processes that consume the output: controllers, services, persistence layers (e.g., course controller/service) that receive validated DTOs
// Risks and safe change note: Changing validation decorators or types can break request validation and data integrity; update dependent services and tests when modifying
// created by: Sadeq Obaid

// Import specific validation decorators used to annotate DTO properties and enforce runtime validation rules
import {
// List of decorators that validate types, presence, lengths, and numeric constraints on properties
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// Define a DTO class representing the payload for creating a course; used by controllers/services to type and validate input
export class CreateCourseDto {
  // Declare a required string property 'title' with minimum and maximum length validation (3..200)
  @IsString() @MinLength(3) @MaxLength(200) title!: string;
  // Declare a required string property 'slug' with min/max length validation (3..220); often used as URL-safe identifier
  @IsString() @MinLength(3) @MaxLength(220) slug!: string;
  // Declare a required string property 'description' with a minimum length of 20 characters to ensure sufficient detail
  @IsString() @MinLength(20) description!: string;
  // Declare a required string property 'objectives' with a minimum length of 10 characters describing learning aims
  @IsString() @MinLength(10) objectives!: string;
  // Declare an optional string property 'prerequisites'; IsOptional allows absence, IsString enforces type when present
  @IsOptional() @IsString() prerequisites?: string;
}

// Define a DTO class representing the payload for creating a lesson; used to validate lesson-specific fields
export class CreateLessonDto {
  // Declare a required string property 'title' with min/max length validation (3..200) for lesson titling
  @IsString() @MinLength(3) @MaxLength(200) title!: string;
  // Declare a required string property 'bodyMarkdown' with a minimum length of 10; expected to contain lesson content in Markdown
  @IsString() @MinLength(10) bodyMarkdown!: string;
  // Declare a required integer 'position' with minimum value 1 representing ordering within a course/module
  @IsInt() @Min(1) position!: number;
  // Declare a required boolean 'isPublished' indicating publication state of the lesson
  @IsBoolean() isPublished!: boolean;
}
