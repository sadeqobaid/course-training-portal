import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ManagementController } from './management.controller.js';
import { ManagementService } from './management.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [ManagementController],
  providers: [ManagementService],
})
export class ManagementModule {}
