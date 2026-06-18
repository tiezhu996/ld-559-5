import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuditLog } from '../../middleware/audit-log';
import { AuthGuard } from '../auth/auth.guard';
import { CreateAppointmentDto, UpdateAppointmentDto } from './appointment.dto';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentService) {}

  @Get()
  async list(@Req() req: any, @Query('status') status?: string, @Query('petId') petId?: string) {
    return { code: 0, message: 'ok', data: await this.service.list(req.user, status, petId) };
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.detail(id, req.user) };
  }

  @Post()
  @AuditLog('创建预约')
  async create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.create(dto, req.user) };
  }

  @Patch(':id')
  @AuditLog('更新预约')
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.update(id, dto, req.user) };
  }

  @Patch(':id/confirm')
  @AuditLog('确认预约')
  async confirm(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.confirm(id, req.user) };
  }

  @Patch(':id/cancel')
  @AuditLog('取消预约')
  async cancel(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.cancel(id, req.user) };
  }

  @Get('reference/vets')
  async listVets() {
    return { code: 0, message: 'ok', data: await this.service.listVets() };
  }

  @Get('reference/clinics')
  async listClinics() {
    return { code: 0, message: 'ok', data: await this.service.listClinics() };
  }
}
