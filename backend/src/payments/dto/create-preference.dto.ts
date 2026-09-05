import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePreferenceDto {
  @IsNotEmpty({ message: 'El ID del turno es obligatorio' })
  @IsString({ message: 'El ID del turno debe ser un texto' })
  appointmentId: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto personalizado debe ser numérico' })
  customAmount?: number;
}
