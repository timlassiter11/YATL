import { NestedKeyOf, UnspecifiedRecord } from './common';

/**
 * A filter object containing keys for the fields to be filtered,
 * and the values used to compare against.
 */
export type Filters<T extends object = UnspecifiedRecord> = Partial<{
  [K in NestedKeyOf<T>]: unknown;
}>;

/**
 * Callback for filtering a row.
 * @param row - The row data.
 * @param index - The index of the row.
 * @returns True if the row matches the filter, false otherwise.
 */
export type FilterCallback<T extends object = UnspecifiedRecord> = (
  row: T,
  index: number,
) => boolean;

/**
 * Callback for filtering a field value against the filter data.
 * @param value - The value to filter.
 * @param filter - The filter to apply.
 * @returns True if the value matches the filter, false otherwise.
 */
export type ColumnFilterCallback = (value: unknown, filter: unknown) => boolean;
