import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Appointment, AppointmentPayload } from '../models/appointment.model';
import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  const sampleAppointments: Appointment[] = [
    {
      id: '2',
      title: 'Afternoon Sync',
      clientName: 'Marcus Reyes',
      clientEmail: 'marcus@university.edu',
      date: '2026-11-24',
      startTime: '14:00',
      endTime: '15:00',
      status: 'Confirmed',
      notes: '',
    },
    {
      id: '1',
      title: 'Morning Review',
      clientName: 'Elena Navarro',
      clientEmail: 'elena@university.edu',
      date: '2026-11-24',
      startTime: '09:00',
      endTime: '10:00',
      status: 'Completed',
      notes: '',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retrieves and chronologically sorts appointments', () => {
    let result: Appointment[] = [];

    service.getAppointments().subscribe((data) => {
      result = data;
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    expect(req.request.method).toBe('GET');
    req.flush(sampleAppointments);

    expect(result.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('passes the date query parameter when filtering by date', () => {
    service.getAppointments('2026-11-24').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/appointments?date=2026-11-24');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates an appointment via POST', () => {
    const payload: AppointmentPayload = {
      title: 'Project Defense',
      clientName: 'Priya Santos',
      clientEmail: 'priya@university.edu',
      date: '2026-11-28',
      startTime: '10:00',
      endTime: '11:30',
      status: 'Pending',
      notes: 'Bring demo slides.',
    };

    let created: Appointment | undefined;
    service.createAppointment(payload).subscribe((record) => {
      created = record;
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: '6', ...payload });

    expect(created?.id).toBe('6');
  });

  it('updates status via PATCH', () => {
    let updated: Appointment | undefined;
    service.updateAppointmentStatus('2', 'Completed').subscribe((record) => {
      updated = record;
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/2');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'Completed' });
    req.flush({ ...sampleAppointments[0], status: 'Completed' });

    expect(updated?.status).toBe('Completed');
  });

  it('deletes an appointment via DELETE', () => {
    let completed = false;
    service.deleteAppointment('1').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('maps status 0 network failures into an actionable API error message', () => {
    let caughtError = '';

    service.getAppointments().subscribe({
      error: (err: Error) => {
        caughtError = err.message;
      },
    });

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(caughtError).toContain('json-server');
  });
});
