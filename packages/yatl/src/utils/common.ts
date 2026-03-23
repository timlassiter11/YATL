import { html, TemplateResult } from 'lit';
import { MatchIndex, RowId, RowSelectionMethod } from '../types';

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
 * Slices a string and wraps matched search indices in a Lit TemplateResult.
 * @param text - The original string to render.
 * @param ranges - An array of {start, end} objects representing matches.
 * @param renderMatch - Optional callback to define how the matched text is wrapped. Defaults to a <mark> tag.
 * @returns A Lit TemplateResult, or the original string if no ranges exist.
 */
export function highlightText(
  text: string,
  ranges?: MatchIndex[],
  renderMatch: (match: string) => TemplateResult = match =>
    html`<mark part="mark">${match}</mark>`,
): TemplateResult | string {
  if (!text || !ranges || ranges.length === 0) {
    return text;
  }

  // Sort ranges by start position
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const mergedRanges: MatchIndex[] = [];
  let currentRange = { ...sortedRanges[0] };

  for (let i = 1; i < sortedRanges.length; i++) {
    const nextRange = sortedRanges[i];

    if (nextRange.start <= currentRange.end) {
      // Overlap so extend the current end
      currentRange.end = Math.max(currentRange.end, nextRange.end);
    } else {
      // No overlap
      mergedRanges.push(currentRange);
      currentRange = { ...nextRange };
    }
  }
  mergedRanges.push(currentRange);

  const result: (string | TemplateResult)[] = [];
  let lastIndex = 0;

  for (const { start, end } of mergedRanges) {
    const safeStart = Math.max(0, Math.min(start, text.length));
    const safeEnd = Math.max(0, Math.min(end, text.length));

    // Append non-highlighted text
    if (safeStart > lastIndex) {
      result.push(text.slice(lastIndex, safeStart));
    }

    // Append highlighted text using the callback
    const matchText = text.slice(safeStart, safeEnd);
    if (matchText) {
      result.push(renderMatch(matchText));
    }

    lastIndex = safeEnd;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return html`${result}`;
}

/*
 * Converts a string to a human-readable format.
 * - Replaces underscores with spaces
 * - Inserts spaces before uppercase letters (for camelCase)
 * - Capitalizes the first letter of each word
 *
 * @param {string} str - The input string to convert.
 * @returns {string} - The converted human-readable string.
 */
export function toHumanReadable(str: string) {
  return (
    str
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Insert spaces before uppercase letters (for camelCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Capitalize the first letter of each word
      .replace(/\b\w/g, char => char.toUpperCase())
  );
}
