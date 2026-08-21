import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAssessmentDto {
  @IsString() @MinLength(3) title!: string;
}

export class CreateQuestionDto {
  @IsString() @MinLength(5) prompt!: string;
  @IsInt() @Min(1) position!: number;
  @IsArray() @ArrayMinSize(2) options!: {
    optionText: string;
    isCorrect: boolean;
  }[];
}

export class SubmitAttemptDto {
  @IsArray() @ArrayMinSize(1) answers!: {
    questionId: string;
    optionId: string;
  }[];
}
