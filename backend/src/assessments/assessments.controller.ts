import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { AuthenticatedUser } from '../common/types.js';
import { AssessmentsService } from './assessments.service.js';
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  SubmitAttemptDto,
} from './assessments.dto.js';

@Controller()
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post('courses/:courseId/assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessments.create(user, courseId, dto);
  }

  @Post('assessments/:assessmentId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  addQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.assessments.addQuestion(user, assessmentId, dto);
  }

  @Get('courses/:courseId/assessment')
  @UseGuards(JwtAuthGuard)
  get(@Param('courseId') courseId: string) {
    return this.assessments.publicAssessment(courseId);
  }

  @Post('enrollments/:enrollmentId/assessments/:assessmentId/attempts')
  @UseGuards(JwtAuthGuard)
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.assessments.submit(user, enrollmentId, assessmentId, dto);
  }
}
