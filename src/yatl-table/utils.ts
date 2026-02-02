import { html, TemplateResult } from 'lit';
import { ColumnState, Compareable } from '../types';

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
 * Highlights sections of a string based on index ranges.
 * @param text - The original string to render.
 * @param ranges - An array of [start, end] tuples representing matches.
 * @returns A Lit TemplateResult with <mark> tags, or the original string if no ranges exist.
 */
export function highlightText(
  text: string,
  ranges: [number, number][],
): TemplateResult | string {
  if (!text || !ranges || ranges.length === 0) {
    return text;
  }

  // 1. Sort ranges by start position to process linearly
  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);

  // 2. Merge overlapping ranges
  // Example: [[0, 5], [2, 6]] becomes [[0, 6]]
  const mergedRanges: [number, number][] = [];
  let currentRange = sortedRanges[0];

  for (let i = 1; i < sortedRanges.length; i++) {
    const nextRange = sortedRanges[i];

    if (nextRange[0] < currentRange[1]) {
      // Overlap detected: Extend the current end if needed
      currentRange[1] = Math.max(currentRange[1], nextRange[1]);
    } else {
      // No overlap: Push current and start a new one
      mergedRanges.push(currentRange);
      currentRange = nextRange;
    }
  }
  mergedRanges.push(currentRange);

  // 3. Slice the string
  const result: (string | TemplateResult)[] = [];
  let lastIndex = 0;

  for (const [start, end] of mergedRanges) {
    // Clamp values to prevent out-of-bounds errors
    const safeStart = Math.max(0, Math.min(start, text.length));
    const safeEnd = Math.max(0, Math.min(end, text.length));

    // Append non-highlighted text before the match
    if (safeStart > lastIndex) {
      result.push(text.slice(lastIndex, safeStart));
    }

    // Append highlighted text
    // We use the 'mark' tag, but you can change this to a span with a class
    result.push(
      html`<mark class="highlight">${text.slice(safeStart, safeEnd)}</mark>`,
    );

    lastIndex = safeEnd;
  }

  // 4. Append any remaining text after the last match
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return html`${result}`;
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

export function isCompareable(value: unknown): value is Compareable {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  );
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
