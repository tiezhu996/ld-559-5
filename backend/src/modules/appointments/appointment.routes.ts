export const appointmentRoutes = {
  list: 'GET /api/v1/appointments',
  detail: 'GET /api/v1/appointments/:id',
  create: 'POST /api/v1/appointments',
  update: 'PATCH /api/v1/appointments/:id',
  confirm: 'PATCH /api/v1/appointments/:id/confirm',
  cancel: 'PATCH /api/v1/appointments/:id/cancel',
  listVets: 'GET /api/v1/appointments/reference/vets',
  listClinics: 'GET /api/v1/appointments/reference/clinics',
} as const;
