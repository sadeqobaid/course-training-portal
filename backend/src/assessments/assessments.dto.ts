// Script name: assessments.dto.ts
// Original location: backend/src/assessments/assessments.dto.ts
// What this script is: TypeScript Data Transfer Object (DTO) definitions that declare shapes and validation rules for assessment-related payloads.
// What it is used for: Provides runtime validation decorators and TypeScript typings for incoming request bodies (assessments, questions, and attempt submissions) so controllers/services receive validated data.
// Programming language: TypeScript
// Inputs: Plain JavaScript/JSON objects (typically HTTP request bodies) representing assessments, questions, and attempt submissions.
// Outputs: Validated DTO-shaped objects (typed instances) or validation errors produced by the validation pipeline.
// Where output is saved or sent: HTTP/API (these DTOs are used during request handling in the API); not directly persisted by this file.
// Technologies and services used or interacted with: class-validator for decorators, TypeScript typings, typically used within a NestJS or similar server framework.
// Downstream scripts/files/processes that consume the output: Controllers, request handlers, services, and persistence layers that accept validated DTOs for business logic and storage.
// Risks and safe change note: Changing validation rules or type shapes will change accepted request payloads and may cause runtime validation failures or data inconsistencies; modify carefully and ensure corresponding controller/service tests are updated.
// created by: Sadeq Obaid

// Import validation decorators and constraint helpers from the class-validator package so DTO properties can be validated at runtime.
import {
// Describe the ArrayMinSize decorator: enforces a minimum number of items on array properties.
  ArrayMinSize,
// Describe the IsArray decorator: validates that a property is an array.
  IsArray,
// Describe the IsInt decorator: validates that a property is an integer.
  IsInt,
// Describe the IsString decorator: validates that a property is a string.
  IsString,
// Describe the Min decorator: validates that a numeric property has a minimum value.
  Min,
// Describe the MinLength decorator: validates that a string property has a minimum character length.
  MinLength,
} from 'class-validator';

// Export a DTO class used to validate creation payloads for an assessment resource.
export class CreateAssessmentDto {
// Validate that the title property is a string and has at least 3 characters; this defines the shape and constraints for incoming assessment create requests.
  @IsString() @MinLength(3) title!: string;
}

// Export a DTO class used to validate creation payloads for a question resource attached to an assessment.
export class CreateQuestionDto {
// Validate that the prompt property is a string with a minimum length of 5 characters; used to ensure question text is present and reasonably sized.
  @IsString() @MinLength(5) prompt!: string;
// Validate that the position property is an integer with a minimum value of 1; this typically denotes ordering of the question within the assessment.
  @IsInt() @Min(1) position!: number;
// Validate that the options property is an array with at least 2 items; the following lines declare the shape of each option object in the array.
  @IsArray() @ArrayMinSize(2) options!: {
    // Each option object must include an optionText property of type string describing the option's label.
    optionText: string;
    // Each option object must include an isCorrect boolean indicating whether this option is the correct answer.
    isCorrect: boolean;
  }[];
}

// Export a DTO class used to validate submission payloads when a user attempts an assessment.
export class SubmitAttemptDto {
// Validate that answers is an array with at least one entry; each entry must include referenced identifiers for question and chosen option.
  @IsArray() @ArrayMinSize(1) answers!: {
    // The questionId field identifies which question the answer corresponds to (typically a string ID).
    questionId: string;
    // The optionId field identifies which option was chosen for the question (typically a string ID).
    optionId: string;
  }[];
// Close the SubmitAttemptDto class definition after declaring the complete answers payload shape.
}
