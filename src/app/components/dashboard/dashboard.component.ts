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

interface DateSummary {
  readonly date: string;
  readonly count: number;
}

interface StatusMetric {
  readonly status: AppointmentStatus;
  readonly count: number;
  readonly percent: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = APPOINTMENT_STATUSES;
  readonly skeletonRows = [1, 2, 3, 4];

  readonly appointments = signal<Appointment[]>([]);
  readonly selectedDate = signal('');
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackTone = signal<'success' | 'error'>('success');
  readonly updatingId = signal<string | null>(null);

  readonly totalCount = computed(() => this.appointments().length);

  readonly statusCounts = computed<Record<AppointmentStatus, number>>(() => {
    const counts: Record<AppointmentStatus, number> = {
      Pending: 0,
      Confirmed: 0,
      Cancelled: 0,
      Completed: 0,
    };

    for (const item of this.appointments()) {
      counts[item.status] += 1;
    }

    return counts;
  });

  readonly statusBreakdown = computed<StatusMetric[]>(() => {
    const total = this.totalCount();
    const counts = this.statusCounts();
    return this.statuses.map((status) => ({
      status,
      count: counts[status],
      percent: total > 0 ? Math.round((counts[status] / total) * 100) : 0,
    }));
  });

  readonly dateSummaries = computed<DateSummary[]>(() => {
    const dateMap = new Map<string, number>();
    for (const item of this.appointments()) {
      dateMap.set(item.date, (dateMap.get(item.date) ?? 0) + 1);
    }

    return Array.from(dateMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count }));
  });

  readonly filteredAppointments = computed(() => {
    const filterDate = this.selectedDate().trim();
    if (!filterDate) {
      return this.appointments();
    }
    return this.appointments().filter((item) => item.date === filterDate);
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.appointmentService
      .getAppointments()
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

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  clearDateFilter(): void {
    this.selectedDate.set('');
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
            `Updated "${updated.title}" status to ${updated.status}.`,
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

  getDuration(appointment: Appointment): string {
    return formatDuration(appointment.startTime, appointment.endTime) ?? '';
  }

  dismissFeedback(): void {
    this.feedbackMessage.set(null);
  }
}
