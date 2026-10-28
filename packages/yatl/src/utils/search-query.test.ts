import { describe, expect, test } from 'vitest';
import { parseSearchQuery, REGEX_SEARCH_PREFIX } from './search-query';

describe('parseSearchQuery', () => {
  test('plain queries are text mode', () => {
    expect(parseSearchQuery('hello')).toEqual({ mode: 'text', value: 'hello' });
    expect(parseSearchQuery('')).toEqual({ mode: 'text', value: '' });
  });

  test('the prefix is a backslash, r, and slash', () => {
    expect(REGEX_SEARCH_PREFIX).toBe(String.raw`\r/`);
  });

  test('\\r without a slash stays text mode', () => {
    const query = String.raw`\reports`;
    expect(parseSearchQuery(query)).toEqual({ mode: 'text', value: query });
  });

  test('the prefix only counts at the start of the query', () => {
    expect(parseSearchQuery(String.raw` \r/foo/`).mode).toBe('text');
  });

  test('parses the pattern and flags', () => {
    const query = parseSearchQuery(String.raw`\r/^err\d+/im`);
    expect(query).toMatchObject({
      mode: 'regex',
      source: String.raw`^err\d+`,
      flags: 'im',
    });
    if (query.mode !== 'regex') throw new Error('expected regex');
    expect(query.regex).toBeInstanceOf(RegExp);
    expect(query.regex!.flags).toBe('gim');
    expect(query.error).toBeUndefined();
  });

  test('the closing delimiter is optional', () => {
    expect(parseSearchQuery(String.raw`\r/foo`)).toMatchObject({
      mode: 'regex',
      source: 'foo',
      flags: '',
    });
  });

  test('an escaped slash inside the pattern is not a delimiter', () => {
    expect(parseSearchQuery(String.raw`\r/a\/b/i`)).toMatchObject({
      source: String.raw`a\/b`,
      flags: 'i',
    });
  });

  test('an escaped trailing slash leaves the pattern unclosed', () => {
    const query = parseSearchQuery(String.raw`\r/a\/`);
    expect(query).toMatchObject({ source: String.raw`a\/`, flags: '' });
    if (query.mode !== 'regex') throw new Error('expected regex');
    expect(query.regex!.test('a/')).toBe(true);
  });

  test('a slash after an escaped backslash is a delimiter', () => {
    expect(parseSearchQuery(String.raw`\r/a\\/i`)).toMatchObject({
      source: String.raw`a\\`,
      flags: 'i',
    });
  });

  test('ignores the g and d flags', () => {
    const query = parseSearchQuery(String.raw`\r/foo/gdi`);
    expect(query).toMatchObject({ flags: 'i' });
    if (query.mode !== 'regex') throw new Error('expected regex');
    expect(query.regex!.flags).toBe('gi');
  });

  test('rejects the sticky flag', () => {
    const query = parseSearchQuery(String.raw`\r/foo/y`);
    expect(query).toMatchObject({ mode: 'regex' });
    if (query.mode !== 'regex') throw new Error('expected regex');
    expect(query.regex).toBeUndefined();
    expect(query.error).toMatch(/sticky/);
  });

  test.each([
    ['an invalid pattern', String.raw`\r/(foo`],
    ['an invalid flag', String.raw`\r/foo/b`],
    ['a duplicate flag', String.raw`\r/foo/ii`],
  ])('reports %s as an error', (_name, raw) => {
    const query = parseSearchQuery(raw);
    if (query.mode !== 'regex') throw new Error('expected regex');
    expect(query.regex).toBeUndefined();
    expect(query.error).toBeTruthy();
  });

  test('an empty pattern is valid', () => {
    expect(parseSearchQuery(String.raw`\r/`)).toMatchObject({
      mode: 'regex',
      source: '',
      flags: '',
    });
  });
});
