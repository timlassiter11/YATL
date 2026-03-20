import { NestedKeyOf, PartialRecord, UnspecifiedRecord } from './common';

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

/**
 * A single match index consisting of the start and end positions
 */
export type MatchIndex = { start: number; end: number };

/**
 * Record containing a list of matched indecies stored by key
 */
export type RowMatchIndices<T extends object = UnspecifiedRecord> =
  PartialRecord<T, MatchIndex[]>;

export interface YatlSearchResult<T extends object = UnspecifiedRecord> {
  item: T;
  score: number;
  matches: RowMatchIndices<T>;
}

export interface YatlFieldSearchOptions<T extends object = UnspecifiedRecord> {
  /**
   * The field within each item to search
   */
  field: NestedKeyOf<T>;

  /**
   * Whether the column's data should be tokenized for searching.
   * If set and the `searchTokenizer` for this column exists, that will be used.
   * Otherwise the table's `searchTokenizer` will be used.
   */
  tokenize?: boolean;

  /**
   * A function for tokenizing this column's data.
   * Fallback to the main table tokenizer if not provided.
   */
  searchTokenizer?: TokenizerCallback;

  getter?: (row: T, key: NestedKeyOf<T>) => unknown;
}

export interface YatlSearchOptions<T extends object = UnspecifiedRecord> {
  data?: T[];
  fields?: YatlFieldSearchOptions<T>[];
  scoredSearch?: boolean;
  tokenizedSearch?: boolean;
  tokenizer?: (query: string) => QueryToken[];
}
