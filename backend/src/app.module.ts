import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { env } from './config/env.js';
import { RequestIdMiddleware } from './common/request-id.middleware.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { CertificatesModule } from './certificates/certificates.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { UsersModule } from './users/users.module.js';
import { ManagementModule } from './management/management.module.js';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret: env.jwtAccessSecret,
      signOptions: { expiresIn: env.jwtAccessTtl as never },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    HealthModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    NotificationsModule,
    AssessmentsModule,
    CertificatesModule,
    ReportsModule,
    UsersModule,
    ManagementModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
