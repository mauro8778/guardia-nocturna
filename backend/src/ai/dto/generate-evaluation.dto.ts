import {
  IsIn,
  IsInt,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class GenerateEvaluationDto {
  @IsString()
  @MaxLength(120)
  subject: string;

  @IsString()
  @IsIn(['Primario', 'Secundario', 'Terciario / Universitario', 'Posgrado / Profesional'])
  academicLevel: string;

  @IsString()
  @IsIn(['multiple_choice', 'open', 'mixed'])
  questionType: string;

  @IsInt()
  @Min(1)
  @Max(30)
  questionCount: number;

  @IsString()
  @IsIn(['facil', 'medio', 'dificil'])
  difficulty: string;

  @IsString()
  @MaxLength(500)
  additionalContext: string;
}
