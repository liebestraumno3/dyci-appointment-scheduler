import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Appointment } from '../../models/appointment.model';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let httpMock: HttpTestingController;

  const mockData: Appointment[] = [
    {
      id: '1',
      title: 'Architecture Review',
      clientName: 'Elena Navarro',
      clientEmail: 'elena@university.edu',
      date: '2026-11-24',
      startTime: '09:00',
      endTime: '10:00',
      status: 'Confirmed',
      notes: 'Finalize API contract.',
    },
    {
      id: '2',
      title: 'Forms Consultation',
      clientName: 'Priya Santos',
      clientEmail: 'priya@university.edu',
      date: '2026-11-25',
      startTime: '11:00',
      endTime: '12:00',
      status: 'Pending',
      notes: '',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads appointments, computes real status counts, and filters agenda by date', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    req.flush(mockData);
    await fixture.whenStable();

    expect(component.totalCount()).toBe(2);
    expect(component.statusCounts().Confirmed).toBe(1);
    expect(component.statusCounts().Pending).toBe(1);

    component.selectDate('2026-11-24');
    await fixture.whenStable();

    expect(component.filteredAppointments().length).toBe(1);
    expect(component.filteredAppointments()[0].id).toBe('1');
  });

  it('displays API error state when initial load fails', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.banner--error')?.textContent).toContain('json-server');
  });
});
