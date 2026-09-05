import { IsBoolean, IsNumber, IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsString()
  teacherPhone?: string;

  @IsOptional()
  @IsString()
  aliasMP?: string;

  @IsOptional()
  @IsString()
  linkMP?: string;

  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @IsOptional()
  @IsNumber()
  startHour?: number;

  @IsOptional()
  @IsNumber()
  endHour?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  availableDays?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  pricingType?: 'PER_HOUR' | 'PER_SUBJECT';

  @IsOptional()
  subjectRates?: Record<string, number>;
}

