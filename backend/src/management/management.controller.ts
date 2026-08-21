import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { AuthenticatedUser } from '../common/types.js';
import { CreateAnnouncementDto } from './management.dto.js';
import { ManagementService } from './management.service.js';

@Controller('management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManagementController {
  constructor(private readonly management: ManagementService) {}

  @Get('courses')
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  courses(@CurrentUser() actor: AuthenticatedUser) {
    return this.management.coursesFor(actor);
  }

  @Post('announcements')
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN')
  announce(@Body() dto: CreateAnnouncementDto) {
    return this.management.announce(dto);
  }
}
