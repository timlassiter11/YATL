import {
  ColumnOptions,
  ColumnState,
  DisplayColumnOptions,
  InternalColumnOptions,
  NestedKeyOf,
} from '../types';

export function findColumn<
  TData extends Record<string, unknown>,
  TCol extends { field: NestedKeyOf<TData> },
>(columns: TCol[], field: NestedKeyOf<TData>) {
  return columns.find(c => c.field === field);
}

export function isInternalColumn<T>(
  col: ColumnOptions<T> | undefined | null,
): col is InternalColumnOptions<T> {
  return col?.role === 'internal';
}

export function isDisplayColumn<T>(
  col: ColumnOptions<T> | undefined | null,
): col is DisplayColumnOptions<T> {
  return col?.role !== 'internal';
}

export function createState<T>(
  field: NestedKeyOf<T>,
  defaults?: Partial<ColumnState<T>>,
): ColumnState<T> {
  return {
    field,
    title: defaults?.title ?? field,
    visible: defaults?.visible ?? true,
    width: defaults?.width ?? null,
    sort: defaults?.sort ? { ...defaults.sort } : null,
  };
}
