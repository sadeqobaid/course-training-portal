import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, ProgressService],
  exports: [EnrollmentsService, ProgressService],
})
export class EnrollmentsModule {}
