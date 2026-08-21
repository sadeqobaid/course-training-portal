import { Module, forwardRef } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller.js';
import { AssessmentsService } from './assessments.service.js';
import { EnrollmentsModule } from '../enrollments/enrollments.module.js';
import { CertificatesModule } from '../certificates/certificates.module.js';

@Module({
  imports: [EnrollmentsModule, forwardRef(() => CertificatesModule)],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
