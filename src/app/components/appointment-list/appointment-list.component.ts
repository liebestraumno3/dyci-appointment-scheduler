import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  APPOINTMENT_STATUSES,
  Appointment,
  AppointmentStatus,
} from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { formatDuration } from '../../validators/time-range.validator';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.css',
})
export class AppointmentListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = APPOINTMENT_STATUSES;
  readonly skeletonRows = [1, 2, 3, 4, 5];

  readonly appointments = signal<Appointment[]>([]);
  readonly selectedDate = signal('');
  readonly searchQuery = signal('');
  readonly selectedStatus = signal<AppointmentStatus | 'All'>('All');

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackTone = signal<'success' | 'error'>('success');
  readonly updatingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly pendingDeleteId = signal<string | null>(null);

  readonly hasActiveFilters = computed(
    () =>
      this.selectedDate().trim() !== '' ||
      this.searchQuery().trim() !== '' ||
      this.selectedStatus() !== 'All',
  );

  readonly filteredAppointments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.appointments().filter((item) => {
      if (status !== 'All' && item.status !== status) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query) ||
        item.clientEmail.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query)
      );
    });
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.pendingDeleteId.set(null);

    const activeDate = this.selectedDate().trim();

    this.appointmentService
      .getAppointments(activeDate || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          this.appointments.set(records);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  onDateFilterChange(): void {
    this.loadAppointments();
  }

  clearFilters(): void {
    const hadDateFilter = this.selectedDate().trim() !== '';
    this.selectedDate.set('');
    this.searchQuery.set('');
    this.selectedStatus.set('All');

    if (hadDateFilter) {
      this.loadAppointments();
    }
  }

  onStatusChange(appointment: Appointment, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nextStatus = select.value as AppointmentStatus;

    if (nextStatus === appointment.status) {
      return;
    }

    this.updatingId.set(appointment.id);
    this.feedbackMessage.set(null);

    this.appointmentService
      .updateAppointmentStatus(appointment.id, nextStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.appointments.update((list) =>
            list.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.updatingId.set(null);
          this.feedbackTone.set('success');
          this.feedbackMessage.set(
            `Status for "${updated.title}" updated to ${updated.status}.`,
          );
        },
        error: (err: Error) => {
          select.value = appointment.status;
          this.updatingId.set(null);
          this.feedbackTone.set('error');
          this.feedbackMessage.set(err.message);
        },
      });
  }

  requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  confirmDelete(appointment: Appointment): void {
    this.deletingId.set(appointment.id);
    this.feedbackMessage.set(null);

    this.appointmentService
      .deleteAppointment(appointment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appointments.update((list) => list.filter((item) => item.id !== appointment.id));
          this.deletingId.set(null);
          this.pendingDeleteId.set(null);
          this.feedbackTone.set('success');
          this.feedbackMessage.set(`Deleted appointment "${appointment.title}".`);
        },
        error: (err: Error) => {
          this.deletingId.set(null);
          this.pendingDeleteId.set(null);
          this.feedbackTone.set('error');
          this.feedbackMessage.set(err.message);
        },
      });
  }

  getDuration(appointment: Appointment): string {
    return formatDuration(appointment.startTime, appointment.endTime) ?? '';
  }

  dismissFeedback(): void {
    this.feedbackMessage.set(null);
  }
}
