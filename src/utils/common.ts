import { ComplexAttributeConverter } from 'lit';
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
      return undefined;
    }
  }

  return current;
}

/**
 * Retrieves the flattened list of elements assigned to a slot.
 *
 * Unlike the native `assignedElements({flatten: true})`, this function
 * correctly falls back to the slot's default content (its light DOM children)
 * if no nodes are assigned.
 *
 * It recursively resolves nested slots in the default content to ensure
 * you always get the final rendered leaf elements.
 */
export function getEffectiveChildren(node: Node): Element[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements({ flatten: true });
    if (assigned.length > 0) {
      return assigned.flatMap(getEffectiveChildren);
    }

    const fallback = Array.from(node.children);
    return fallback.flatMap(getEffectiveChildren);
  }
  if (node instanceof Element) {
    return [node];
  }
  return [];
}


/**
 * Lit Property converter to convert between date string and date objects
 */
class DateConverter implements ComplexAttributeConverter<Date | undefined> {
  public fromAttribute(value: string) {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? undefined : date;
  }

  public toAttribute(value: Date | string | undefined) {
    // If the user sets a string, convert it to a date to make sure its valid
    if (typeof value === 'string') {
      value = this.fromAttribute(value);
    }

    if (!value || isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
} 

export const dateConverter = new DateConverter();
