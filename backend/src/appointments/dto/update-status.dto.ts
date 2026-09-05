import { IsIn, IsNotEmpty } from 'class-validator';

export type AppointmentStatus = 'DRAFT_UNPAID' | 'RECEIPT_SUBMITTED' | 'CONFIRMED_PAID' | 'CANCELLED';

export class UpdateAppointmentStatusDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsIn(['DRAFT_UNPAID', 'RECEIPT_SUBMITTED', 'CONFIRMED_PAID', 'CANCELLED'], {
    message: 'El estado debe ser DRAFT_UNPAID, RECEIPT_SUBMITTED, CONFIRMED_PAID o CANCELLED',
  })
  status: AppointmentStatus = 'DRAFT_UNPAID';
}

