import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { AuthenticatedUser } from '../common/types.js';
import { CreateCourseDto, CreateLessonDto } from './courses.dto.js';
import { CoursesService } from './courses.service.js';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list() {
    return this.courses.listPublished();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.courses.detail(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourseDto) {
    return this.courses.create(user, dto);
  }

  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  addLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.courses.addLesson(user, id, dto);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN')
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.courses.publish(user, id);
  }
}
