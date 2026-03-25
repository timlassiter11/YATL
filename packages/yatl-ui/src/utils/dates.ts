/**
 * Utility functions for native JavaScript Date manipulation.
 * These functions always return new Date instances to prevent accidental
 * mutation of the original inputs.
 */

/**
 * Returns a new Date object with the time strictly set to midnight (00:00:00.000).
 * This is crucial for standardizing dates before performing equality or range comparisons.
 * @param date - The original Date object.
 * @returns A new Date object representing the same day at 00:00:00 local time.
 */
export function getDateOnly(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Returns a new Date object representing the first day of the month
 * for the provided date, completely normalized to midnight.
 * @param date - The Date object indicating the target month and year.
 * @returns A new Date object set to the 1st of the month at 00:00:00 local time.
 */
export function getFirstDayOfMonth(date: Date): Date {
  const newDate = getDateOnly(date);
  newDate.setDate(1);
  return newDate;
}

/**
 * Returns a new Date object representing the first day of the week
 * that contains the provided date.
 * @param date - A Date object falling anywhere within the target week.
 * @param index - The day index that starts the week (0 = Sunday, 1 = Monday, etc.). Defaults to 0.
 * @returns A new Date object set to the start of the week at 00:00:00 local time.
 */
export function getFirstDayOfWeek(date: Date, index: number = 0): Date {
  const newDate = getDateOnly(date);
  const dayOfWeek = newDate.getDay();
  // Calculate how many days we need to step backward to reach the start of the week
  const diff = dayOfWeek >= index ? dayOfWeek - index : 6 - dayOfWeek;
  newDate.setDate(newDate.getDate() - diff);
  return newDate;
}

/**
 * Adds or subtracts a specific number of days from a given date.
 * The browser's native Date engine automatically handles month rollovers and leap years.
 * @param date - The starting Date object.
 * @param days - The number of days to add (use a negative number to subtract).
 * @returns A new Date object offset by the specified number of days.
 */
export function addDaysToDate(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Generates an array of 7 Date objects representing a full week,
 * starting from the designated first day of the week.
 * @param date - Any Date object falling within the desired week.
 * @param index - The day index that starts the week (0 = Sunday, 1 = Monday, etc.). Defaults to 0.
 * @returns An array of 7 new Date objects representing the consecutive days of the week all starting at 00:00:00 local time.
 */
export function getDaysOfWeek(date: Date, index: number = 0): Date[] {
  let currentDate = getFirstDayOfWeek(date, index);
  const days: Date[] = [];

  for (let i = 0; i < 7; ++i) {
    days.push(currentDate);
    currentDate = addDaysToDate(currentDate, 1);
  }

  return days;
}

/**
 * Determines if a given date falls strictly between a start and end date.
 * * Note: This evaluation is EXCLUSIVE. It will return false if the date exactly
 * matches the start or end date. This is intended for styling the days *between*
 * the endpoints in a calendar UI.
 * @param date - The target Date object to evaluate.
 * @param start - The start Date of the range (can be undefined).
 * @param end - The end Date of the range (can be undefined).
 * @returns True if the date falls strictly between the start and end dates.
 */
export function isInDateRange(
  date: Date,
  start: Date | undefined,
  end: Date | undefined,
): boolean {
  if (!start || !end) {
    return false;
  }

  // Normalize all dates to midnight so hours/minutes don't skew the logic
  const dateTime = getDateOnly(date).getTime();
  const startTime = getDateOnly(start).getTime();
  const endTime = getDateOnly(end).getTime();

  return startTime < dateTime && endTime > dateTime;
}

export function datesEqual(a: Date | undefined, b: Date | undefined) {
  const aTime = a ? getDateOnly(a).getTime() : Infinity;
  const bTime = b ? getDateOnly(b).getTime() : Infinity;
  return aTime === bTime;
}
