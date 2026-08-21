// Script name: certificates.module.ts
// Original location: backend/src/certificates/certificates.module.ts
// What this script is: NestJS module definition configuring imports, controllers, providers, and exports for certificates functionality.
// What it is used for: Registers CertificatesController and CertificatesService and imports NotificationsModule so certificate-related features and notifications are wired into the NestJS application.
// Programming language: TypeScript
// Inputs: None at runtime; this file supplies module metadata to the NestJS application (imports/controllers/providers).
// Outputs: Exports CertificatesService to the NestJS dependency injection system for use by other modules.
// Where output is saved or sent: Other: NestJS dependency injection container
// Technologies and services used or interacted with: NestJS framework, TypeScript, local NotificationsModule, CertificatesController, CertificatesService
// Downstream scripts/files/processes that consume the output: Any module or provider that imports CertificatesModule or injects CertificatesService (e.g., other modules, controllers, background jobs).
// Risks and safe change note: Changing imports/exports or provider registrations can break DI or route handling; add/remove exports only when you understand module boundaries and update dependent code accordingly. Keep file extension imports (.js/.ts) consistent with build tooling.
// created by: Sadeq Obaid

// Import the Module decorator from NestJS which marks a class as a module and accepts metadata about imports, controllers, providers, and exports.
import { Module } from '@nestjs/common';
// Import the CertificatesController class to register it as a controller in this module (handles incoming requests related to certificates).
import { CertificatesController } from './certificates.controller.js';
// Import the CertificatesService to register as a provider and to be exported for DI (encapsulates certificate-related business logic).
import { CertificatesService } from './certificates.service.js';
// Import NotificationsModule to include notification-related providers so CertificatesService or controller can use them via DI.
import { NotificationsModule } from '../notifications/notifications.module.js';

// Apply the @Module decorator to configure module metadata: imports, controllers, providers, and exports.
@Module({
  // Include NotificationsModule in this module's imports so its exported providers are available to this module's providers/controllers.
  imports: [NotificationsModule],
  // Register CertificatesController so NestJS routes requests for certificates to it.
  controllers: [CertificatesController],
  // Register CertificatesService as a provider available within this module's scope; used for DI.
  providers: [CertificatesService],
  // Export CertificatesService so other modules that import CertificatesModule can inject and use it.
  exports: [CertificatesService],
})
// Close the Module decorator metadata object.
// Define and export the CertificatesModule class; NestJS uses this class as the module token for DI and module composition.
export class CertificatesModule {}
