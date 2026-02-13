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
    visible: defaults?.visible ?? true,
    width: defaults?.width ?? null,
    sort: defaults?.sort ? { ...defaults.sort } : null,
  };
}

export function getColumnStateChanges<T>(
  oldState: ColumnState<T> | undefined,
  newState: ColumnState<T>,
): (keyof ColumnState<T>)[] {
  if (oldState && oldState.field !== newState.field) {
    throw Error(
      `attempting to compare states for different fields: ${oldState.field}, ${newState.field}`,
    );
  }

  const changes: (keyof ColumnState<T>)[] = [];
  if (oldState?.visible !== newState.visible) {
    changes.push('visible');
  }

  if (oldState?.width !== newState.width) {
    changes.push('width');
  }

  if (
    oldState?.sort !== newState.sort ||
    oldState.sort?.order !== newState.sort?.order ||
    oldState.sort?.priority !== newState.sort?.priority
  ) {
    changes.push('sort');
  }

  return changes;
}
