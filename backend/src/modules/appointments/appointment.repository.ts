import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppointmentStatus, UserRole } from '../../constants/enums';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(user: { sub: string; role: UserRole }, status?: string, petId?: string) {
    const where: Prisma.AppointmentWhereInput = {
      ...(user.role === UserRole.VET ? { vetId: user.sub } : {}),
      ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}),
      ...(status ? { status: status as AppointmentStatus } : {}),
      ...(petId ? { petId } : {}),
    };
    return this.prisma.appointment.findMany({
      where,
      include: { pet: true, vet: true, clinic: true },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: { pet: true, vet: true, clinic: true },
    });
  }

  create(data: Prisma.AppointmentUncheckedCreateInput) {
    return this.prisma.appointment.create({
      data,
      include: { pet: true, vet: true, clinic: true },
    });
  }

  update(id: string, data: Prisma.AppointmentUncheckedUpdateInput) {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: { pet: true, vet: true, clinic: true },
    });
  }

  findUpcomingForReminder(start: Date, end: Date) {
    return this.prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: start, lte: end },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED] },
        reminderSent: false,
      },
      include: { pet: { include: { owner: true } }, vet: true, clinic: true },
    });
  }

  markReminderSent(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { reminderSent: true },
    });
  }

  listVets() {
    return this.prisma.user.findMany({
      where: { role: 'VET' },
      select: { id: true, name: true, email: true },
    });
  }

  listClinics() {
    return this.prisma.clinic.findMany({
      select: { id: true, name: true, address: true, phone: true },
    });
  }
}
