import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { AppointmentListComponent } from './appointment-list.component';

describe('AppointmentListComponent', () => {
  let httpMock: HttpTestingController;

  const mockRecords: Appointment[] = [
    {
      id: '1',
      title: 'Architecture Review',
      clientName: 'Elena Navarro',
      clientEmail: 'elena@university.edu',
      date: '2026-11-24',
      startTime: '09:00',
      endTime: '10:00',
      status: 'Confirmed',
      notes: 'Review REST endpoints.',
    },
    {
      id: '2',
      title: 'Accessibility Audit',
      clientName: 'Daniel Lim',
      clientEmail: 'daniel@university.edu',
      date: '2026-11-25',
      startTime: '15:00',
      endTime: '16:30',
      status: 'Pending',
      notes: 'Check WCAG AA contrast.',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('queries the API with ?date when date filter changes', async () => {
    const fixture = TestBed.createComponent(AppointmentListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3000/appointments').flush(mockRecords);
    await fixture.whenStable();

    component.selectedDate.set('2026-11-24');
    component.onDateFilterChange();

    const filteredReq = httpMock.expectOne('http://localhost:3000/appointments?date=2026-11-24');
    expect(filteredReq.request.method).toBe('GET');
    filteredReq.flush([mockRecords[0]]);
    await fixture.whenStable();

    expect(component.filteredAppointments().length).toBe(1);
    expect(component.filteredAppointments()[0].title).toBe('Architecture Review');
  });

  it('deletes an appointment via two-step confirmation and updates the table', async () => {
    const fixture = TestBed.createComponent(AppointmentListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3000/appointments').flush(mockRecords);
    await fixture.whenStable();

    component.requestDelete('1');
    component.confirmDelete(mockRecords[0]);

    const deleteReq = httpMock.expectOne('http://localhost:3000/appointments/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
    await fixture.whenStable();

    expect(component.appointments().length).toBe(1);
    expect(component.feedbackMessage()).toContain('Deleted appointment');
  });
});
