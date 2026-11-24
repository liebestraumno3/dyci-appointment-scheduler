import { FormControl, FormGroup } from '@angular/forms';
import {
  TimeRangeError,
  formatDuration,
  parseTimeToMinutes,
  timeRangeValidator,
} from './time-range.validator';

describe('timeRangeValidator (Cross-Field Validation)', () => {
  function createTimeGroup(startTime: string, endTime: string) {
    return new FormGroup(
      {
        startTime: new FormControl(startTime, { nonNullable: true }),
        endTime: new FormControl(endTime, { nonNullable: true }),
      },
      { validators: [timeRangeValidator] },
    );
  }

  it('returns null when endTime is strictly later than startTime', () => {
    const group = createTimeGroup('09:00', '10:30');
    expect(group.valid).toBe(true);
    expect(group.hasError('timeRangeInvalid')).toBe(false);
  });

  it('allows a minimum one-minute duration', () => {
    const group = createTimeGroup('09:59', '10:00');
    expect(group.valid).toBe(true);
    expect(group.errors).toBeNull();
  });

  it('flags timeRangeInvalid with reason "same" when startTime equals endTime', () => {
    const group = createTimeGroup('10:00', '10:00');
    expect(group.invalid).toBe(true);
    const error = group.getError('timeRangeInvalid') as TimeRangeError;
    expect(error.reason).toBe('same');
    expect(error.message).toContain('cannot equal');
  });

  it('flags timeRangeInvalid with reason "before" when endTime is earlier than startTime', () => {
    const group = createTimeGroup('14:30', '13:00');
    expect(group.invalid).toBe(true);
    const error = group.getError('timeRangeInvalid') as TimeRangeError;
    expect(error.reason).toBe('before');
    expect(error.message).toContain('must be strictly later');
  });

  it('defers empty inputs to Validators.required by returning null', () => {
    const emptyBoth = createTimeGroup('', '');
    const emptyEnd = createTimeGroup('09:00', '');
    expect(emptyBoth.errors).toBeNull();
    expect(emptyEnd.errors).toBeNull();
  });

  it('re-evaluates automatically when startTime is modified after endTime', () => {
    const group = createTimeGroup('09:00', '10:00');
    expect(group.valid).toBe(true);

    group.controls.startTime.setValue('11:00');
    expect(group.hasError('timeRangeInvalid')).toBe(true);

    group.controls.endTime.setValue('12:00');
    expect(group.hasError('timeRangeInvalid')).toBe(false);
  });

  it('parses valid 24-hour times and formats positive durations', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
    expect(parseTimeToMinutes('25:00')).toBeNull();

    expect(formatDuration('09:00', '10:30')).toBe('1h 30m');
    expect(formatDuration('09:00', '11:00')).toBe('2h');
    expect(formatDuration('10:15', '11:00')).toBe('45m');
    expect(formatDuration('11:00', '10:00')).toBeNull();
  });
});
