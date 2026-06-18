import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus, VisitType } from '../../constants/enums';

export class CreateAppointmentDto {
  @IsString() petId!: string;
  @IsString() vetId!: string;
  @IsString() clinicId!: string;
  @IsDateString() appointmentDate!: string;
  @IsEnum(VisitType) type!: VisitType;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional() @IsDateString() appointmentDate?: string;
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
  @IsOptional() @IsString() notes?: string;
}
