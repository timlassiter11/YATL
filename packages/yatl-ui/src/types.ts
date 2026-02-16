export type MaybePromise<T> = Promise<T> | T;

/** The reason for a table data fetch task to be called */
export type YatlTableFetchReason = 'init' | 'reload';

/** Options for a fetch task */
export interface YatlFetchOptions {
  /** If the table overlay should be shown while fetching */
  silent: boolean;
}

/** Context for a fetch request being called */
export interface YatlTableFetchContext {
  /** The reason for the fetch request */
  reason: YatlTableFetchReason;
  /** Options to configure how the fetch request should be handled */
  options: YatlFetchOptions;
}

/** A task for fetching table data. */
export type YatlTableFetchTask<T> = (
  context: YatlTableFetchContext,
) => MaybePromise<T[] | undefined>;
