import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../common/types.js';

export class CreateAnnouncementDto {
  @IsString() @MinLength(3) @MaxLength(250) subject!: string;
  @IsString() @MinLength(3) body!: string;
  @IsOptional() @IsIn(['LEARNER', 'INSTRUCTOR', 'TRAINING_ADMIN'] as const)
  recipientRole?: UserRole;
}
