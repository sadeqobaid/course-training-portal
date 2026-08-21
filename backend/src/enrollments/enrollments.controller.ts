import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { AuthenticatedUser } from '../common/types.js';
import { EnrollmentsService } from './enrollments.service.js';
import { ProgressService } from '../progress/progress.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(
    private readonly enrollments: EnrollmentsService,
    private readonly progress: ProgressService,
  ) {}

  @Post('courses/:courseId/enroll')
  enroll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollments.enroll(user, courseId);
  }

  @Get('me/enrollments')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollments.myEnrollments(user);
  }

  @Post('enrollments/:enrollmentId/lessons/:lessonId/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progress.completeLesson(user, enrollmentId, lessonId);
  }

  @Get('enrollments/:enrollmentId/progress')
  async summary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    await this.enrollments.ownedEnrollment(user, enrollmentId);
    return this.progress.summary(enrollmentId);
  }
}
