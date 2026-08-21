import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { DatabaseService } from '../database/database.service.js';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN')
export class ReportsController {
  constructor(private readonly database: DatabaseService) {}

  @Get('completions')
  completions() {
    return this.database.query(
      `SELECT course_id, title, total_enrollments, completed_enrollments FROM course_completion_report ORDER BY title`,
    );
  }
}
