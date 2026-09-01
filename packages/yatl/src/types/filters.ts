import { NestedKeyOf, UnspecifiedRecord } from './common';

/**
 * A filter object containing keys for the fields to be filtered,
 * and the values used to compare against.
 *
 * Keys are flat dotted-path strings identifying a (possibly nested) field,
 * the same convention used everywhere else a field is referenced (column
 * `field`, `sort()`, `getColumnState()`, etc.) - they are not a nested
 * object mirroring the shape of the row data.
 * @example
 * ```ts
 * // Row shape: { name: string, address: { city: string } }
 * const filters: Filters<Row> = {
 *   name: 'Alice',
 *   'address.city': 'NY', // NOT { address: { city: 'NY' } }
 * };
 * ```
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
  filters: Filters<T>,
) => boolean;

/**
 * Callback for filtering a field value against the filter data.
 * @param value - The value to filter.
 * @param filter - The filter to apply.
 * @returns True if the value matches the filter, false otherwise.
 */
export type ColumnFilterCallback = (value: unknown, filter: unknown) => boolean;
