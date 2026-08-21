import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { env } from '../config/env.js';

@Module({
  imports: [
    JwtModule.register({
      secret: env.jwtAccessSecret,
      signOptions: { expiresIn: env.jwtAccessTtl as never },
    }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
