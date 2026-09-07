import { IsString, MaxLength } from 'class-validator';

export class GenerateComunicadoDto {
  @IsString()
  @MaxLength(120)
  teacherName: string;

  @IsString()
  @MaxLength(300)
  subjects: string;

  @IsString()
  @MaxLength(400)
  motivo: string;

  @IsString()
  @MaxLength(200)
  destinatario: string;
}
