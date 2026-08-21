// Script name: reports.module.ts
// Original location: backend/src/reports/reports.module.ts
// What this script is: A NestJS module definition that groups the reports controller into a module
// What it is used for: Registers the ReportsController with Nest's module system so its routes/controllers are available to the application
// Programming language: TypeScript
// Inputs: Imports of NestJS Module decorator and the ReportsController class
// Outputs: Exports the ReportsModule class for consumption by other modules (e.g., AppModule)
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework (decorators, module system), TypeScript module imports
// Downstream scripts/files/processes that consume the output: Application bootstrap (AppModule), other modules that import ReportsModule, routing layer that invokes ReportsController
// Risks and safe change note: Removing or renaming the controller import or the exported class will break DI and routing; add tests and update imports when modifying controllers/providers
// created by: Sadeq Obaid

// Import the Module decorator from NestJS which is used to declare a class as a Nest module and attach metadata.
import { Module } from '@nestjs/common';

// Import the ReportsController so it can be registered in this module's controllers array and wired into Nest's routing.
import { ReportsController } from './reports.controller.js';

// Apply the Module decorator with metadata: here we register the ReportsController so Nest instantiates and routes to it.
// This decorator attaches the controllers array to the module and influences dependency injection and routing behavior.
@Module({ controllers: [ReportsController] })

// Export the ReportsModule class which represents the module; other parts of the application import this class to include its controllers.
// The class is intentionally empty because configuration is provided via the decorator metadata above.
export class ReportsModule {}
