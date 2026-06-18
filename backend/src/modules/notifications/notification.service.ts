import { Injectable } from '@nestjs/common';
import { addDays } from '../../utils/date';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentRepository } from '../appointments/appointment.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentRepo: AppointmentRepository,
  ) {}

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async scanAndCreateReminders() {
    const now = new Date();
    const vaccineDue = await this.prisma.vaccineRecord.findMany({
      where: { nextDueDate: { gte: now, lte: addDays(now, 7) } },
      include: { pet: true },
    });
    for (const item of vaccineDue) {
      await this.prisma.notification.create({
        data: {
          userId: item.pet.ownerId,
          title: '疫苗即将到期',
          content: `${item.pet.name} 的 ${item.vaccineName} 需要续种`,
          type: 'VACCINE',
        },
      }).catch(() => undefined);
    }

    const policies = await this.prisma.insurancePolicy.findMany({
      where: { endDate: { gte: now, lte: addDays(now, 30) } },
      include: { pet: true },
    });
    for (const policy of policies) {
      await this.prisma.notification.create({
        data: {
          userId: policy.pet.ownerId,
          title: '保单即将续保',
          content: `${policy.pet.name} 的 ${policy.provider} 保单即将到期`,
          type: 'INSURANCE',
        },
      }).catch(() => undefined);
    }

    const tomorrowStart = addDays(new Date(), 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = addDays(tomorrowStart, 1);
    const upcomingAppointments = await this.appointmentRepo.findUpcomingForReminder(tomorrowStart, tomorrowEnd);
    for (const apt of upcomingAppointments) {
      const dateStr = apt.appointmentDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      await this.prisma.notification.create({
        data: {
          userId: apt.pet.ownerId,
          title: '明日预约提醒',
          content: `您的宠物 ${apt.pet.name} 明日 ${dateStr} 在 ${apt.clinic.name} 有预约，请准时到达。`,
          type: 'APPOINTMENT',
        },
      }).catch(() => undefined);
      await this.prisma.notification.create({
        data: {
          userId: apt.vetId,
          title: '明日预约提醒',
          content: `明日 ${dateStr} 您在 ${apt.clinic.name} 有 ${apt.pet.name} 的预约，请做好准备。`,
          type: 'APPOINTMENT',
        },
      }).catch(() => undefined);
      await this.appointmentRepo.markReminderSent(apt.id).catch(() => undefined);
    }
  }
}
