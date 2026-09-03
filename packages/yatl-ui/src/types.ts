import { TemplateResult } from 'lit';

export type MaybePromise<T> = Promise<T> | T;

/** The reason for a table data fetch task to be called */
export type YatlTableFetchReason = 'init' | 'reload' | (string & {});

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

export type YatlSize = 'small' | 'medium' | 'large';

export type YatlToastVariant = 'neutral' | 'success' | 'warning' | 'danger';

export type YatlSelectionMethod = 'single' | 'multi' | 'leaf';

export interface YatlOptionData {
  value: string;
  label: string;
}

export interface YatlToastData {
  /**
   * Unique id for the toast. Supplying the id of an existing toast updates
   * it in place (and restarts its duration timer if it's still showing)
   * instead of creating a new one. Auto-generated when omitted - `toast()`
   * always returns the id that ends up being used.
   */
  id?: string;
  label?: string;
  message: string | TemplateResult;
  variant?: YatlToastVariant;
  duration?: number;
  /**
   * When `false`, the toast is not kept in `yatl-notification-center`'s
   * history once it's dismissed. Defaults to `true`.
   */
  persist?: boolean;
  /**
   * Controls whether this call can show/re-show the toast live:
   * - omitted (default): shows live normally, whether creating or updating.
   * - `'always'`: never shows live - only creates/updates the
   *   `yatl-notification-center` entry. A brand-new toast raised this way
   *   starts already dismissed, so it never shows live, even the first time.
   * - `'onUpdate'`: shows live when this call creates a brand-new toast,
   *   but never re-shows it live when this call updates an existing one -
   *   useful when the caller can't tell whether this is the first attempt
   *   or a repeat (e.g. a retrying API call with no memory of prior
   *   attempts), since the store already knows from whether `id` matches
   *   an existing record.
   */
  silent?: 'always' | 'onUpdate';
}
