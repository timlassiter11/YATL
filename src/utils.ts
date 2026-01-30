import { html, TemplateResult } from 'lit';
import {
  ColumnOptions,
  Compareable,
  DisplayColumnOptions,
  InternalColumnOptions,
} from './types';

/*
 * Converts a string to a human-readable format.
 * - Replaces underscores with spaces
 * - Inserts spaces before uppercase letters (for camelCase)
 * - Capitalizes the first letter of each word
 *
 * @param {string} str - The input string to convert.
 * @returns {string} - The converted human-readable string.
 */
export const toHumanReadable = (str: string) => {
  return (
    str
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Insert spaces before uppercase letters (for camelCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Capitalize the first letter of each word
      .replace(/\b\w/g, char => char.toUpperCase())
  );
};

export const createRegexTokenizer = (exp: string = '\\S+') => {
  const regex = new RegExp(`"[^"]*"|${exp}`, 'g');

  return (value: string) => {
    // Find all matches, which will include the quotes
    const matches = value.match(regex) || [];

    // Clean up the results by removing the surrounding quotes
    return matches.map(token => {
      token = token.toLocaleLowerCase().trim();
      if (token.startsWith('"') && token.endsWith('"')) {
        return { value: token.slice(1, -1), quoted: true };
      }
      return { value: token, quoted: false };
    });
  };
};

export const whitespaceTokenizer = createRegexTokenizer();

// Source - https://stackoverflow.com/a
// Posted by Emma
// Retrieved 2026-01-26, License - CC BY-SA 4.0
export function isStringRecord(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== 'object') return false;

  if (Array.isArray(obj)) return false;

  if (Object.getOwnPropertySymbols(obj).length > 0) return false;

  return true;
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

export function isCompareable(value: unknown): value is Compareable {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  );
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
