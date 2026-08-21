// Script name: roles.decorator.ts
// Original location: backend/src/common/roles.decorator.ts
// What this script is: A small NestJS decorator factory module that defines a metadata key and a Roles decorator for attaching role metadata to route handlers or controllers.
// What it is used for: To annotate controller methods or classes with required user roles so authorization guards can read that metadata and allow/deny access.
// Programming language: TypeScript
// Inputs: UserRole values passed as variadic arguments to the Roles decorator when applied to controllers or handlers.
// Outputs: Metadata attached to the target (controller or method) under the ROLES_KEY; no direct function return persisted to storage.
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS (SetMetadata), local types definition file (types.js), Node/TypeScript runtime.
// Downstream scripts/files/processes that consume the output: Authentication/authorization guards (e.g., RolesGuard), controllers that check metadata, request handling pipeline in NestJS.
// Risks and safe change note: Changing the metadata key string or the exported decorator shape will break guards and any consumers relying on this exact key and signature; safe changes are limited to adding exports, not renaming existing identifiers or altering the metadata format.
// created by: Sadeq Obaid

// Import SetMetadata from NestJS common module so we can attach custom metadata to route handlers and controllers.
// This function returns a decorator that stores the provided metadata key/value on the target; used below to implement the Roles decorator.
import { SetMetadata } from '@nestjs/common';

// Import the UserRole type from a local types module to type-check the roles accepted by the Roles decorator.
// This ensures callers of Roles provide only valid role values defined in the application.
import { UserRole } from './types.js';

// Define and export a constant string key under which role metadata will be stored on targets.
// This stable key is read by authorization guards to retrieve required roles; changing it would break consumers.
export const ROLES_KEY = 'roles';

// Define and export the Roles decorator factory: it accepts any number of UserRole values and returns the decorator produced by SetMetadata.
// When applied, the resulting decorator attaches an array of roles to the target under ROLES_KEY; authorization guards read this metadata to enforce access control.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
