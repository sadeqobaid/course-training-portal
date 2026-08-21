import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { USER_ROLES, UserRole } from '../common/types.js';

export class CreateManagedUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) @MaxLength(200) fullName!: string;
  @IsString() @MinLength(10) password!: string;
  @IsIn(USER_ROLES) role!: UserRole;
}

export class UpdateManagedUserDto {
  @IsOptional() @IsIn(USER_ROLES) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
