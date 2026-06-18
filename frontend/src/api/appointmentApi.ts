import { request, unwrap } from '../utils/request';
import { mockAppointments, mockClinics, mockVets } from '../utils/mockData';
import type { Appointment, Clinic, Vet } from '../types/appointment';

export const appointmentApi = {
  list: (params?: { status?: string; petId?: string }) =>
    unwrap<Appointment[]>(request.get('/appointments', { params }), mockAppointments),
  detail: (id: string) =>
    unwrap<Appointment>(request.get(`/appointments/${id}`), mockAppointments[0]),
  create: (payload: Partial<Appointment>) =>
    request.post('/appointments', payload),
  update: (id: string, payload: Partial<Appointment>) =>
    request.patch(`/appointments/${id}`, payload),
  confirm: (id: string) =>
    request.patch(`/appointments/${id}/confirm`),
  cancel: (id: string) =>
    request.patch(`/appointments/${id}/cancel`),
  listVets: () =>
    unwrap<Vet[]>(request.get('/appointments/reference/vets'), mockVets),
  listClinics: () =>
    unwrap<Clinic[]>(request.get('/appointments/reference/clinics'), mockClinics),
};
