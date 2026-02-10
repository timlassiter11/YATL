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

export function setNestedValue(obj: object, path: string, value: unknown) {
  const keys = path.split('.');
  const finalProp = keys.at(-1);
  if (!finalProp) {
    throw new Error('Cannot set nested value with empty path');
  }

  let current = obj;
  for (const key of keys.slice(0, -1)) {
    if (!isValidKey(key, current)) {
      const newObj = {};
      Object.assign(current, { [key]: newObj });
      current = newObj;
    } else {
      current = current[key];
    }
  }

  Object.assign(current, { [finalProp]: value });
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

// SOURCE: https://github.com/shoelace-style/webawesome/blob/next/packages/webawesome/src/internal/active-elements.ts#L14
/**
 * Use a generator so we can iterate and possibly break early.
 * @example
 *   // to operate like a regular array. This kinda nullifies generator benefits, but worth knowing if you need the whole array.
 *   const allActiveElements = [...activeElements()]
 *
 *   // Early return
 *   for (const activeElement of activeElements()) {
 *     if (<cond>) {
 *       break; // Break the loop, don't need to iterate over the whole array or store an array in memory!
 *     }
 *   }
 */
export function* activeElements(
  activeElement: Element | null = document.activeElement,
): Generator<Element> {
  if (activeElement === null || activeElement === undefined) return;

  yield activeElement;

  if (
    'shadowRoot' in activeElement &&
    activeElement.shadowRoot &&
    activeElement.shadowRoot.mode !== 'closed'
  ) {
    yield* activeElements(activeElement.shadowRoot.activeElement);
  }
}
