import { ColumnState } from '../../types';

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

export function getCompareableValue(value: unknown) {
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
  } else {
    return String(value);
  }
}

/**
 * Creates a mapping of values to their sorted rank (0-based index).
 * Handles locale comparison correctly during the setup phase.
 */
export function createRankMap(
  values: [unknown, unknown][],
  locale?: string,
): Map<unknown, number> {
  const unique = Array.from(new Set(values));
  // Use Intl.Collator for high-performance, correct locale sorting
  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: 'base',
  });

  unique.sort(([_aOrig, aMod], [_bOrig, bMod]) => {
    if (aMod == null && bMod == null) return 0;
    if (aMod == null) return -1;
    if (aMod == null) return 1;
    const aValue = getCompareableValue(aMod);
    const bValue = getCompareableValue(bMod);
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return collator.compare(String(aValue), String(bValue));
    }

    if (aValue < bValue) return -1;
    if (bValue < aValue) return 1;
    return 0;
  });

  const rankMap = new Map<unknown, number>();
  unique.forEach(([orig, _mod], index) => rankMap.set(orig, index));
  return rankMap;
}
