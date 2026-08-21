// Script name: roles.guard.ts
// Original location: backend/src/common/roles.guard.ts
// What this script is: A NestJS guard implementing role-based access control for incoming requests
// What it is used for: Reads role metadata and the authenticated user's role to allow or deny route handler execution
// Programming language: TypeScript
// Inputs: ExecutionContext (from NestJS), metadata key ROLES_KEY, request.user (AuthenticatedUser)
// Outputs: boolean true when access is allowed, or throws ForbiddenException when denied
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework (common, core), Reflector, custom roles decorator and types
// Downstream scripts/files/processes that consume the output: NestJS request pipeline, controllers and any downstream authorization logic depends on this guard's decision
// Risks and safe change note: Changing this file affects global authorization; ensure tests cover role metadata retrieval, handler/class precedence and user role shapes. Avoid altering thrown exception types or returning non-boolean values.
// created by: Sadeq Obaid
import {
  // Begin import list from @nestjs/common: brings in interfaces and classes needed for guard behavior and exceptions
  CanActivate,
  // CanActivate: interface implemented by guards to determine request access
  ExecutionContext,
  // ExecutionContext: abstraction of the current request/handler/class context provided by NestJS
  ForbiddenException,
  // ForbiddenException: exception thrown to deny access (HTTP 403)
  Injectable,
  // Injectable: decorator marking the class for dependency injection
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// Reflector: utility to read metadata set by decorators on handlers and classes
import { ROLES_KEY } from './roles.decorator.js';
// ROLES_KEY: metadata key used by the custom roles decorator to store required roles
import { AuthenticatedUser, UserRole } from './types.js';
// AuthenticatedUser, UserRole: application-specific types describing user payload and role enum

@Injectable()
// Marks the guard as injectable so NestJS can instantiate it and inject dependencies
export class RolesGuard implements CanActivate {
  // RolesGuard: a guard class that implements CanActivate to enforce role checks
  constructor(private readonly reflector: Reflector) {}
  // Constructor injects Reflector via NestJS DI; reflector is used to read metadata about required roles

  canActivate(context: ExecutionContext): boolean {
    // canActivate: called by NestJS to decide whether the current request should proceed
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      // Retrieve role metadata for the current handler or class, with handler taking precedence
      context.getHandler(),
      // First search metadata on the handler (method) level
      context.getClass(),
      // Then search metadata on the controller (class) level
    ]);
    // 'roles' will be undefined when no roles are defined, or an array of UserRole when present
    if (!roles || roles.length === 0) return true;
    // If no roles metadata is present, allow access (guard is not restricting)
    const request = context
      // Obtain the underlying HTTP request object from the execution context
      .switchToHttp()
      // Switch the ExecutionContext to the HTTP context variant
      .getRequest<{ user?: AuthenticatedUser }>();
    // getRequest: typed request object which may include an optional authenticated user
    if (!request.user || !roles.includes(request.user.role))
      // If there is no authenticated user or the user's role is not listed in required roles
      throw new ForbiddenException('Your role cannot perform this action.');
    // Throwing ForbiddenException terminates the request with HTTP 403 and the provided message
    return true;
    // If the user's role is allowed, permit the request to proceed
  }
  // End of canActivate method
}
// End of RolesGuard class
