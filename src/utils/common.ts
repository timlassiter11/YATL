import { RowId, RowSelectionMethod } from '../types';

export function isRowIdType(value: unknown): value is RowId {
  return typeof value === 'string' || typeof value === 'number';
}

export function isRowSelectionMethod(
  value: string | null,
): value is RowSelectionMethod {
  return value === null || value === 'multi' || value === 'single';
}

function isValidKey<K extends string>(
  key: string,
  obj: Record<K, unknown>,
): key is K {
  return key in obj;
}

/**
 * Get a value from an object based on a path.
 * @param obj - The object to get the value from
 * @param path - The path of the value
 * @returns The value found at the given path
 */
export function getNestedValue(obj: object, path: string): unknown {
  const keys = path.split('.');

  let current = obj;

  for (const key of keys) {
    if (current && isValidKey(key, current)) {
      current = current[key];
    } else {
      return undefined; // Or handle the error as needed
    }
  }

  return current;
}
