import { IsIn, IsString, MaxLength } from 'class-validator';

export class GeneratePlanificacionDto {
  @IsString()
  @MaxLength(120)
  subject: string;

  @IsString()
  @IsIn(['Primario', 'Secundario', 'Terciario / Universitario', 'Posgrado / Profesional'])
  academicLevel: string;

  @IsString()
  @IsIn(['bimestral', 'trimestral', 'cuatrimestral'])
  periodType: string;
}
