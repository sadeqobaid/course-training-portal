import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { AuthenticatedUser } from '../common/types.js';
import { CertificatesService } from './certificates.service.js';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('verify/:code')
  async verify(@Param('code') code: string) {
    const certificate = await this.certificates.verify(code);
    if (!certificate)
      throw new NotFoundException('Certificate verification code is invalid.');
    return certificate;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.certificates.mine(user.id);
  }
}
