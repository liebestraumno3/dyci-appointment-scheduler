import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppointmentFormComponent } from './appointment-form.component';

describe('AppointmentFormComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('displays cross-field inline validation error when endTime is not strictly later than startTime', async () => {
    const fixture = TestBed.createComponent(AppointmentFormComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    component.appointmentForm.controls.startTime.setValue('15:00');
    component.appointmentForm.controls.startTime.markAsDirty();
    component.appointmentForm.controls.endTime.setValue('14:00');
    component.appointmentForm.controls.endTime.markAsDirty();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('#time-range-error');
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(alert?.textContent).toContain('must be strictly later');
    expect(submitBtn.disabled).toBe(true);
  });

  it('clears cross-field error and renders duration when endTime is valid', async () => {
    const fixture = TestBed.createComponent(AppointmentFormComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    component.appointmentForm.controls.startTime.setValue('09:00');
    component.appointmentForm.controls.endTime.setValue('10:30');
    component.appointmentForm.controls.endTime.markAsDirty();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#time-range-error')).toBeNull();
    expect(compiled.querySelector('.duration-preview')?.textContent).toContain('1h 30m');
  });

  it('submits valid appointment payload via POST and displays success feedback', async () => {
    const fixture = TestBed.createComponent(AppointmentFormComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    component.appointmentForm.setValue({
      title: 'Sprint Retrospective',
      clientName: 'Group 7 Panel',
      clientEmail: 'panel@university.edu',
      date: '2026-11-30',
      startTime: '13:00',
      endTime: '14:00',
      status: 'Confirmed',
      notes: 'Review test logs.',
    });

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:3000/appointments');
    expect(req.request.method).toBe('POST');
    req.flush({
      id: '99',
      ...req.request.body,
    });

    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.banner--success')?.textContent).toContain('Sprint Retrospective');
  });
});
