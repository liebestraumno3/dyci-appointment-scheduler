export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'Pending',
  'Confirmed',
  'Cancelled',
  'Completed',
] as const;

export interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
}

export type AppointmentPayload = Omit<Appointment, 'id'>;
