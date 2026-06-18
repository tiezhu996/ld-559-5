import { Injectable } from '@nestjs/common';
import { AppointmentStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { CreateAppointmentDto, UpdateAppointmentDto } from './appointment.dto';
import { AppointmentRepository } from './appointment.repository';
import { validateAppointmentDate } from './appointment.validator';

@Injectable()
export class AppointmentService {
  constructor(private readonly repo: AppointmentRepository) {}

  list(user: { sub: string; role: UserRole }, status?: string, petId?: string) {
    return this.repo.findMany(user, status, petId);
  }

  async detail(id: string, user: { sub: string; role: UserRole }) {
    const appointment = await this.repo.findById(id);
    if (!appointment) throw new BusinessException('预约不存在', 40401);
    if (user.role === UserRole.PET_OWNER && appointment.pet.ownerId !== user.sub) {
      throw new BusinessException('无权查看该预约', 40302);
    }
    if (user.role === UserRole.VET && appointment.vetId !== user.sub) {
      throw new BusinessException('无权查看该预约', 40302);
    }
    return appointment;
  }

  create(dto: CreateAppointmentDto, user: { sub: string; role: UserRole }) {
    const appointmentDate = new Date(dto.appointmentDate);
    validateAppointmentDate(appointmentDate);
    return this.repo.create({
      ...dto,
      appointmentDate,
      status: AppointmentStatus.PENDING,
    });
  }

  async update(id: string, dto: UpdateAppointmentDto, user: { sub: string; role: UserRole }) {
    const appointment = await this.repo.findById(id);
    if (!appointment) throw new BusinessException('预约不存在', 40401);
    if (user.role === UserRole.VET && appointment.vetId !== user.sub) {
      throw new BusinessException('无权操作该预约', 40302);
    }
    if (user.role === UserRole.PET_OWNER && appointment.pet.ownerId !== user.sub) {
      throw new BusinessException('无权操作该预约', 40302);
    }

    const data: any = { ...dto };
    if (dto.appointmentDate) {
      data.appointmentDate = new Date(dto.appointmentDate);
      validateAppointmentDate(data.appointmentDate);
      if (dto.status === undefined) {
        data.status = AppointmentStatus.RESCHEDULED;
      }
    }
    return this.repo.update(id, data);
  }

  async confirm(id: string, user: { sub: string; role: UserRole }) {
    const appointment = await this.repo.findById(id);
    if (!appointment) throw new BusinessException('预约不存在', 40401);
    if (user.role === UserRole.VET && appointment.vetId !== user.sub) {
      throw new BusinessException('无权操作该预约', 40302);
    }
    return this.repo.update(id, { status: AppointmentStatus.CONFIRMED });
  }

  async cancel(id: string, user: { sub: string; role: UserRole }) {
    const appointment = await this.repo.findById(id);
    if (!appointment) throw new BusinessException('预约不存在', 40401);
    if (user.role === UserRole.PET_OWNER && appointment.pet.ownerId !== user.sub) {
      throw new BusinessException('无权操作该预约', 40302);
    }
    if (user.role === UserRole.VET && appointment.vetId !== user.sub) {
      throw new BusinessException('无权操作该预约', 40302);
    }
    return this.repo.update(id, { status: AppointmentStatus.CANCELLED });
  }

  listVets() {
    return this.repo.listVets();
  }

  listClinics() {
    return this.repo.listClinics();
  }
}
