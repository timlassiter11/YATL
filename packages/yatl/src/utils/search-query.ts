import { ParsedSearchQuery } from '../types/search';

/**
 * Prefix that switches a search query into regex mode.
 * The full syntax is `\r/pattern/flags`, where the closing `/` and flags are optional.
 */
export const REGEX_SEARCH_PREFIX = '\\r/';

/**
 * Parses a raw search query into either a plain text query or a regex query.
 *
 * Queries starting with {@link REGEX_SEARCH_PREFIX} are treated as regular
 * expressions using the `\r/pattern/flags` syntax. The closing delimiter is
 * the last unescaped `/` and is optional, so `\r/foo` is the pattern `foo`
 * with no flags. Matching is case-sensitive unless the `i` flag is given.
 *
 * The `g` and `d` flags are ignored since the search engine handles those
 * itself, and the `y` (sticky) flag is rejected.
 *
 * @param query - The raw search query.
 * @returns The parsed query. Invalid regex queries have an `error` and no `regex`.
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  if (!query.startsWith(REGEX_SEARCH_PREFIX)) {
    return { mode: 'text', value: query };
  }

  const body = query.slice(REGEX_SEARCH_PREFIX.length);
  let source = body;
  let flags = '';

  // Flags can't contain a '/' so only the last one can be the closing delimiter.
  const close = body.lastIndexOf('/');
  if (close !== -1 && !isEscaped(body, close)) {
    source = body.slice(0, close);
    flags = body.slice(close + 1);
  }

  flags = flags.replace(/[gd]/g, '');
  if (flags.includes('y')) {
    return {
      mode: 'regex',
      source,
      flags,
      error: 'The sticky (y) flag is not supported',
    };
  }

  try {
    const regex = new RegExp(source, flags + 'g');
    return { mode: 'regex', source, flags, regex };
  } catch (error) {
    return {
      mode: 'regex',
      source,
      flags,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Checks if the character at the given index is escaped by
 * an odd number of preceding backslashes.
 */
function isEscaped(value: string, index: number) {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && value[i] === '\\'; i--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
}
