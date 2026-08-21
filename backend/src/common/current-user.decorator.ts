// Script name: current-user.decorator.ts
// Original location: backend/src/common/current-user.decorator.ts
// What this script is: A NestJS custom parameter decorator that extracts the authenticated user from an HTTP request.
// What it is used for: To inject the currently authenticated user (AuthenticatedUser) into controller handler parameters.
// Programming language: TypeScript
// Inputs: ExecutionContext provided by NestJS when the decorator is evaluated; decorator call data (unused, typed as unknown).
// Outputs: An AuthenticatedUser object (returned to the decorated controller parameter).
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework (createParamDecorator, ExecutionContext), TypeScript types, local types file.
// Downstream scripts/files/processes that consume the output: NestJS controller handlers and any services or middleware receiving the injected user parameter.
// Risks and safe change note: Changing extraction logic or types may break authentication assumptions across controllers; ensure tests and calling controllers remain compatible before modifying.
// created by: Sadeq Obaid

// Import createParamDecorator and ExecutionContext from the NestJS common package to build a custom parameter decorator and access request context.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// Import the AuthenticatedUser type from the local types file to annotate the decorator's return value.
import { AuthenticatedUser } from './types.js';

// Define and export the CurrentUser decorator by creating a parameter decorator; this assigns the decorator function to the exported constant.
export const CurrentUser = createParamDecorator(
// The decorator factory function receives optional data (unused, typed unknown) and the NestJS ExecutionContext; it is annotated to return AuthenticatedUser.
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    // Use the ExecutionContext to switch to the HTTP context and obtain the request object, typed to include a user property of AuthenticatedUser.
    return context.switchToHttp().getRequest<{ user: AuthenticatedUser }>()
      // Access and return the user property from the request; this value becomes the injected parameter in controller handlers.
      .user;
  },
// Close the createParamDecorator call by ending the arrow function and argument list.
);
