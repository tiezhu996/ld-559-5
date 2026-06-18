import { BusinessException } from '../../exceptions/business.exception';

export function validateAppointmentDate(date: Date) {
  if (date.getTime() < Date.now()) {
    throw new BusinessException('预约时间不能早于当前时间', 40001);
  }
}
