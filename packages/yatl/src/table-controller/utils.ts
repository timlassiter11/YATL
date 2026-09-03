import type { NullsOrder, SortOrder } from '../types/columns';

/**
 * Comparator result for a null value being compared against a non-null
 * one, given a column's `nullsOrder` and the active sort direction.
 * Returns -1 if the null should sort before the non-null value, 1 if after.
 */
export function compareNullTo(
  nullsOrder: NullsOrder,
  direction: SortOrder,
): -1 | 1 {
  switch (nullsOrder) {
    case 'first':
      return -1;
    case 'last':
      return 1;
    case 'smallest':
      return direction === 'asc' ? -1 : 1;
    case 'largest':
      return direction === 'asc' ? 1 : -1;
  }
}

export function getComparableValue(value: unknown) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return value;
  } else if (typeof value === 'boolean') {
    return Number(value);
  } else if (value instanceof Date) {
    return value.getTime();
  } else if (value != null) {
    return String(value);
  }
  return value;
}
