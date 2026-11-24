import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  Appointment,
  AppointmentPayload,
  AppointmentStatus,
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  readonly apiUrl = 'http://localhost:3000/appointments';

  /**
   * Retrieves appointments from the mock REST API, optionally filtered by ISO date (YYYY-MM-DD).
   * Results are sorted chronologically by date and start time.
   */
  getAppointments(date?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    const trimmedDate = date?.trim();

    if (trimmedDate) {
      params = params.set('date', trimmedDate);
    }

    return this.http.get<Appointment[]>(this.apiUrl, { params }).pipe(
      map((appointments) =>
        [...appointments].sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
        }),
      ),
      catchError((error: HttpErrorResponse) => this.handleError('load appointments', error)),
    );
  }

  /**
   * Retrieves a single appointment record by ID.
   */
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http
      .get<Appointment>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('load appointment', error)));
  }

  /**
   * Creates a new appointment record via HTTP POST.
   */
  createAppointment(payload: AppointmentPayload): Observable<Appointment> {
    return this.http
      .post<Appointment>(this.apiUrl, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError('create appointment', error)),
      );
  }

  /**
   * Replaces an existing appointment record via HTTP PUT.
   */
  updateAppointment(id: string, payload: AppointmentPayload): Observable<Appointment> {
    return this.http
      .put<Appointment>(`${this.apiUrl}/${encodeURIComponent(id)}`, { id, ...payload })
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError('update appointment', error)),
      );
  }

  /**
   * Partially updates only the status field of an appointment via HTTP PATCH.
   */
  updateAppointmentStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http
      .patch<Appointment>(`${this.apiUrl}/${encodeURIComponent(id)}`, { status })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.handleError('update appointment status', error),
        ),
      );
  }

  /**
   * Permanently deletes an appointment record via HTTP DELETE.
   */
  deleteAppointment(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError('delete appointment', error)),
      );
  }

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      return throwError(
        () =>
          new Error(
            'Unable to reach the Appointment API at http://localhost:3000. Verify that json-server is running.',
          ),
      );
    }

    if (error.status === 404) {
      return throwError(() => new Error('The requested appointment record was not found (HTTP 404).'));
    }

    const detail = error.statusText || 'Unexpected server error';
    return throwError(
      () => new Error(`Failed to ${operation} (HTTP ${error.status}: ${detail}).`),
    );
  }
}
