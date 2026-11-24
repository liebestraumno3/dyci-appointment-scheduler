import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';
import {
  APPOINTMENT_STATUSES,
  AppointmentPayload,
  AppointmentStatus,
} from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import {
  TimeRangeError,
  formatDuration,
  timeRangeValidator,
} from '../../validators/time-range.validator';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css',
})
export class AppointmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly appointmentService = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = APPOINTMENT_STATUSES;

  readonly editId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editId() !== null);

  readonly isLoadingRecord = signal(false);
  readonly isSubmitting = signal(false);
  readonly hasSubmitted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly timeRangeError = signal<TimeRangeError | null>(null);
  readonly durationLabel = signal<string | null>(null);
  readonly notesLength = signal(0);
  readonly isTimeTouchedOrDirty = signal(false);

  readonly appointmentForm = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      clientName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      clientEmail: ['', [Validators.required, Validators.email]],
      date: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      status: ['Pending' as AppointmentStatus, [Validators.required]],
      notes: ['', [Validators.maxLength(300)]],
    },
    { validators: [timeRangeValidator] },
  );

  readonly showTimeRangeError = computed(
    () =>
      this.timeRangeError() !== null &&
      (this.isTimeTouchedOrDirty() || this.hasSubmitted()),
  );

  ngOnInit(): void {
    merge(this.appointmentForm.valueChanges, this.appointmentForm.statusChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncDerivedValidationState();
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      this.editId.set(id);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.hasSubmitted.set(false);

      if (id) {
        this.loadExistingAppointment(id);
      } else {
        this.resetFormToDefaults();
      }
    });
  }

  loadExistingAppointment(id: string): void {
    this.isLoadingRecord.set(true);
    this.errorMessage.set(null);

    this.appointmentService
      .getAppointmentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointment) => {
          this.appointmentForm.reset({
            title: appointment.title,
            clientName: appointment.clientName,
            clientEmail: appointment.clientEmail,
            date: appointment.date,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status,
            notes: appointment.notes,
          });
          this.syncDerivedValidationState();
          this.isLoadingRecord.set(false);
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
          this.isLoadingRecord.set(false);
        },
      });
  }

  onTimeBlur(): void {
    this.syncDerivedValidationState();
  }

  isFieldInvalid(controlName: keyof typeof this.appointmentForm.controls): boolean {
    const control = this.appointmentForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty || this.hasSubmitted());
  }

  getFieldError(controlName: keyof typeof this.appointmentForm.controls): string | null {
    const control = this.appointmentForm.controls[controlName];
    if (!this.isFieldInvalid(controlName) || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }
    if (control.errors['email']) {
      return 'Enter a valid email address (e.g., name@domain.edu).';
    }
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength as number;
      return `Must be at least ${requiredLength} characters.`;
    }
    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength as number;
      return `Must not exceed ${requiredLength} characters.`;
    }

    return 'Invalid value.';
  }

  onSubmit(): void {
    this.hasSubmitted.set(true);
    this.appointmentForm.markAllAsTouched();
    this.syncDerivedValidationState();

    if (this.appointmentForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.appointmentForm.getRawValue();
    const payload: AppointmentPayload = {
      title: raw.title.trim(),
      clientName: raw.clientName.trim(),
      clientEmail: raw.clientEmail.trim(),
      date: raw.date,
      startTime: raw.startTime,
      endTime: raw.endTime,
      status: raw.status,
      notes: raw.notes.trim(),
    };

    const currentEditId = this.editId();
    const request$ = currentEditId
      ? this.appointmentService.updateAppointment(currentEditId, payload)
      : this.appointmentService.createAppointment(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.isSubmitting.set(false);
        if (currentEditId) {
          this.successMessage.set(`Saved changes to "${saved.title}" (ID #${saved.id}).`);
          this.appointmentForm.markAsPristine();
        } else {
          this.successMessage.set(
            `Scheduled "${saved.title}" for ${saved.date} (${saved.startTime} - ${saved.endTime}).`,
          );
          this.resetFormToDefaults();
        }
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  resetFormToDefaults(): void {
    this.hasSubmitted.set(false);
    this.appointmentForm.reset({
      title: '',
      clientName: '',
      clientEmail: '',
      date: '',
      startTime: '',
      endTime: '',
      status: 'Pending',
      notes: '',
    });
    this.syncDerivedValidationState();
  }

  dismissSuccess(): void {
    this.successMessage.set(null);
  }

  retryLoad(): void {
    const id = this.editId();
    if (id) {
      this.loadExistingAppointment(id);
    }
  }

  private syncDerivedValidationState(): void {
    const error = (this.appointmentForm.getError('timeRangeInvalid') as TimeRangeError | null) ?? null;
    this.timeRangeError.set(error);

    const startControl = this.appointmentForm.controls.startTime;
    const endControl = this.appointmentForm.controls.endTime;
    this.isTimeTouchedOrDirty.set(
      startControl.dirty || startControl.touched || endControl.dirty || endControl.touched,
    );

    const duration = formatDuration(startControl.value, endControl.value);
    this.durationLabel.set(error ? null : duration);
    this.notesLength.set(this.appointmentForm.controls.notes.value.length);
  }
}
