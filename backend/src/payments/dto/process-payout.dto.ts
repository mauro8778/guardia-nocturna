import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProcessPayoutDto {
  @IsNotEmpty({ message: 'El ID del docente es obligatorio' })
  @IsString()
  teacherId: string;

  @IsNotEmpty({ message: 'El monto a transferir/liquidar es obligatorio' })
  @IsNumber()
  @Min(1, { message: 'El monto a transferir debe ser mayor a 0' })
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
