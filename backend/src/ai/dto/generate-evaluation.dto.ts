import {
  IsIn,
  IsInt,
  IsString,
  MaxLength,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class GenerateEvaluationDto {
  @IsString()
  @MaxLength(150)
  subject: string;

  @IsString()
  @IsIn(['Primario', 'Secundario', 'Terciario / Universitario', 'Posgrado / Profesional'])
  academicLevel: string;

  @IsString()
  @IsIn(['multiple_choice', 'open', 'mixed', 'practical_cases'])
  questionType: string;

  @IsInt()
  @Min(1)
  @Max(30)
  questionCount: number;

  @IsString()
  @IsIn(['facil', 'medio', 'dificil', 'exigente'])
  difficulty: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estimatedTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  skillsFocus?: string;

  @IsString()
  @MaxLength(1000)
  additionalContext: string;
}
