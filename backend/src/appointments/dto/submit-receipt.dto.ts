import { IsOptional, IsString } from 'class-validator';

export class SubmitReceiptDto {
  @IsOptional()
  @IsString()
  receiptRef?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
