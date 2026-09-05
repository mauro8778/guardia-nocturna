import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string = '';

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string = '';
}

