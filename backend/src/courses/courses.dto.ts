import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @IsString() @MinLength(3) @MaxLength(200) title!: string;
  @IsString() @MinLength(3) @MaxLength(220) slug!: string;
  @IsString() @MinLength(20) description!: string;
  @IsString() @MinLength(10) objectives!: string;
  @IsOptional() @IsString() prerequisites?: string;
}

export class CreateLessonDto {
  @IsString() @MinLength(3) @MaxLength(200) title!: string;
  @IsString() @MinLength(10) bodyMarkdown!: string;
  @IsInt() @Min(1) position!: number;
  @IsBoolean() isPublished!: boolean;
}
