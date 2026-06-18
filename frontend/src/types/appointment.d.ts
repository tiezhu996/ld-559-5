import { AppointmentStatus, VisitType } from '../constants/enums';
import type { Pet } from './pet';

export interface Vet {
  id: string;
  name: string;
  email: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Appointment {
  id: string;
  petId: string;
  vetId: string;
  clinicId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  type: VisitType;
  reason?: string;
  notes?: string;
  reminderSent: boolean;
  pet?: Pet;
  vet?: Vet;
  clinic?: Clinic;
  createdAt: string;
  updatedAt: string;
}
