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
  // 1. If the node is a SLOT, we need to resolve it
  if (node instanceof HTMLSlotElement) {
    // Try to get the projected content (flatten: true handles slots-assigned-to-slots)
    const assigned = node.assignedElements({ flatten: true });

    // A. If the user provided content, resolve THAT content
    // (There might be another slot inside the assigned content, though rare in Light DOM)
    if (assigned.length > 0) {
      return assigned.flatMap(getEffectiveChildren);
    }

    // B. If no content was provided, use the Fallback Content (The slot's own children)
    const fallback = Array.from(node.children);
    return fallback.flatMap(getEffectiveChildren);
  }

  // 2. If the node is a regular Element, it IS the content. Return it.
  if (node instanceof Element) {
    return [node];
  }

  // 3. Ignore text nodes/comments for "Child Element" queries
  return [];
}
