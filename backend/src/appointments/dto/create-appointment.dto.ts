import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  date: string = '';

  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'La hora de inicio debe estar en formato HH:mm' })
  startTime: string = '';

  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'La hora de fin debe estar en formato HH:mm' })
  endTime: string = '';

  @IsNotEmpty({ message: 'La materia/tema es obligatorio' })
  @IsString()
  subject: string = '';

  @IsOptional()
  @IsString()
  academicLevel?: string;

  @IsOptional()
  @IsString()
  specificTopics?: string;

  @IsOptional()
  @IsString()
  studyMaterialUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsString()
  modality?: 'VIRTUAL' | 'PRESENCIAL';

  @IsOptional()
  @IsString()
  locationType?: 'VIRTUAL' | 'TEACHER_LOCATION' | 'STUDENT_HOME';

  @IsOptional()
  @IsString()
  classAddress?: string;

  @IsOptional()
  @IsString()
  classType?: 'INDIVIDUAL' | 'GROUP';
}

