import { NestedKeyOf } from './common';

/**
 * A filter object containing keys for the fields to be filtered,
 * and the values used to compare against.
 */
export type Filters<T> = Partial<{ [K in NestedKeyOf<T>]: unknown }>;

/**
 * Callback for filtering a row.
 * @param row - The row data.
 * @param index - The index of the row.
 * @returns True if the row matches the filter, false otherwise.
 */
export type FilterCallback<T> = (row: T, index: number) => boolean;

/**
 * Callback for filtering a field value against the filter data.
 * @param value - The value to filter.
 * @param filter - The filter to apply.
 * @returns True if the value matches the filter, false otherwise.
 */
export type ColumnFilterCallback = (value: unknown, filter: unknown) => boolean;

/**
 * A single query token derived from a larger string
 */
export interface QueryToken {
  /**
   * The value to use for the token
   */
  value: string;

  /**
   * If the token should be treated as quoted.
   * Quoted tokens are searched for exactly, no partial matches.
   */
  quoted: boolean;
}

/**
 * Callback for tokenizing a value into a list of string tokens.
 * @param value - The value to tokenize.
 * @returns An array of tokens.
 */
export type TokenizerCallback = (value: string) => QueryToken[];
