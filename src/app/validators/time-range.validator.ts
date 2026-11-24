import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface TimeRangeError {
  startTime: string;
  endTime: string;
  reason: 'same' | 'before';
  message: string;
}

/**
 * Parses a 24-hour "HH:mm" clock value into minutes elapsed since 00:00.
 * Returns null if the string is not a valid 24-hour time.
 */
export function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/**
 * Returns a human-readable duration (e.g. "1h 30m") when endTime is strictly after startTime.
 */
export function formatDuration(startTime: string, endTime: string): string | null {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  const totalMinutes = endMinutes - startMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * FormGroup-level custom Cross-Field Validator.
 *
 * Ensures that an appointment's `endTime` is strictly later than its `startTime`.
 * Because the validator is bound to the parent FormGroup, Angular automatically
 * re-evaluates the time window whenever either `startTime` or `endTime` changes.
 */
export const timeRangeValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const startControl = group.get('startTime');
  const endControl = group.get('endTime');

  if (!startControl || !endControl) {
    return null;
  }

  const startValue = typeof startControl.value === 'string' ? startControl.value.trim() : '';
  const endValue = typeof endControl.value === 'string' ? endControl.value.trim() : '';

  // Let individual Validators.required handle missing values.
  if (!startValue || !endValue) {
    return null;
  }

  const startMinutes = parseTimeToMinutes(startValue);
  const endMinutes = parseTimeToMinutes(endValue);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  if (endMinutes <= startMinutes) {
    const reason: 'same' | 'before' = endMinutes === startMinutes ? 'same' : 'before';
    const message =
      reason === 'same'
        ? `End time (${endValue}) cannot equal start time (${startValue}).`
        : `End time (${endValue}) must be strictly later than start time (${startValue}).`;

    const error: TimeRangeError = {
      startTime: startValue,
      endTime: endValue,
      reason,
      message,
    };

    return { timeRangeInvalid: error };
  }

  return null;
};
