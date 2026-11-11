import type { FieldPart, FieldSegment, SegmentValues } from './segmented-field';

type DatePart = 'month' | 'day' | 'year';

/**
 * A date segment's key. `prefix` keeps the keys unique when a field has
 * more than one date, e.g. "start" gives "startMonth".
 */
export function dateSegmentKey(prefix: string, part: DatePart) {
  return prefix ? `${prefix}${part[0].toUpperCase()}${part.slice(1)}` : part;
}

/** Month, day and year segments in the locale's order, with its separators */
export function dateParts(prefix = ''): FieldPart[] {
  const label = (part: DatePart) => (prefix ? `${prefix} ${part}` : part);
  const segments: Record<DatePart, FieldSegment> = {
    month: {
      key: dateSegmentKey(prefix, 'month'),
      label: label('month'),
      placeholder: 'mm',
      min: 1,
      max: 12,
      digits: 2,
    },
    day: {
      key: dateSegmentKey(prefix, 'day'),
      label: label('day'),
      placeholder: 'dd',
      min: 1,
      max: 31,
      digits: 2,
    },
    year: {
      key: dateSegmentKey(prefix, 'year'),
      label: label('year'),
      placeholder: 'yyyy',
      min: 1,
      max: 9999,
      digits: 4,
    },
  };

  const sample = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(2000, 10, 22));

  const parts: FieldPart[] = [];
  for (const part of sample) {
    if (part.type === 'month' || part.type === 'day' || part.type === 'year') {
      parts.push({ type: 'segment', segment: segments[part.type] });
    } else if (part.type === 'literal') {
      parts.push({ type: 'literal', text: part.value });
    }
  }
  return parts;
}

/** A date's segment values, all null without a date */
export function dateToSegments(
  date: Date | undefined,
  prefix = '',
): SegmentValues {
  return {
    [dateSegmentKey(prefix, 'month')]: date ? date.getMonth() + 1 : null,
    [dateSegmentKey(prefix, 'day')]: date ? date.getDate() : null,
    [dateSegmentKey(prefix, 'year')]: date ? date.getFullYear() : null,
  };
}

/** How many of a date's segments are filled in, 0 to 3 */
export function filledDateSegments(values: SegmentValues, prefix = '') {
  return (['month', 'day', 'year'] as const).filter(
    part => values[dateSegmentKey(prefix, part)] != null,
  ).length;
}

/**
 * The date filled-in segments make, at midnight local time, or undefined
 * if any are empty or they don't make a real date (e.g. February 30).
 */
export function segmentsToDate(
  values: SegmentValues,
  prefix = '',
): Date | undefined {
  const month = values[dateSegmentKey(prefix, 'month')];
  const day = values[dateSegmentKey(prefix, 'day')];
  const year = values[dateSegmentKey(prefix, 'year')];
  if (month == null || day == null || year == null) {
    return undefined;
  }
  const date = new Date(2000, 0, 1);
  // setFullYear, so years under 100 aren't read as 19xx
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}
