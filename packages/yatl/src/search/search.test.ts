import { describe, expect, test, vi } from 'vitest';
import { YatlSearchEngine } from './search';

interface Person {
  id: number;
  name: string;
  bio: string;
  age: number;
}

const getData = (): Person[] => [
  {
    id: 1,
    name: 'Alice Johnson',
    bio: 'Loves hiking and photography',
    age: 30,
  },
  { id: 2, name: 'Bob Smith', bio: 'Enjoys cooking Italian food', age: 25 },
  {
    id: 3,
    name: 'Charlie Brown',
    bio: 'A dedicated software engineer',
    age: 35,
  },
];

describe('YatlSearchEngine', () => {
  // #region Basic substring search

  describe('Basic substring search', () => {
    test('matches case-insensitively', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }],
      });

      const results = engine.search('ALICE');
      expect(results.map(r => r.item.id)).toEqual([1]);
    });

    test('returns no results for a non-matching query', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }],
      });

      expect(engine.search('zzz')).toEqual([]);
    });

    test('returns every row with score 0 for an empty query', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }],
      });

      const results = engine.search('');
      expect(results).toHaveLength(3);
      expect(results.every(r => r.score === 0)).toBe(true);
    });

    test('respects the subset parameter instead of searching all data', () => {
      const data = getData();
      const engine = new YatlSearchEngine<Person>({
        data,
        fields: [{ field: 'name' }],
      });

      // Search only the first two rows, even though Charlie also exists.
      const results = engine.search('o', data.slice(0, 2));
      expect(results.map(r => r.item.id).sort()).toEqual([1, 2]);
    });

    test('skips non-string field values instead of crashing', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'age' }],
      });

      expect(() => engine.search('30')).not.toThrow();
      expect(engine.search('30')).toEqual([]);
    });

    test('finds multiple occurrences of the same substring within a field', () => {
      const engine = new YatlSearchEngine<{ id: number; text: string }>({
        data: [{ id: 1, text: 'ababab' }],
        fields: [{ field: 'text' }],
      });

      const [result] = engine.search('ab');
      expect(result.matches.text).toEqual([
        { start: 0, end: 2 },
        { start: 2, end: 4 },
        { start: 4, end: 6 },
      ]);
    });
  });

  // #endregion
  // #region Scored search

  describe('scoredSearch', () => {
    test('ranks an exact match above a prefix match above a substring match', () => {
      const engine = new YatlSearchEngine<{ id: number; text: string }>({
        data: [
          { id: 1, text: 'application' }, // substring match for "app"
          { id: 2, text: 'app' }, // exact match
          { id: 3, text: 'apple' }, // prefix match
        ],
        fields: [{ field: 'text' }],
        scoredSearch: true,
      });

      const results = engine.search('app');
      expect(results.map(r => r.item.id)).toEqual([2, 3, 1]);
    });

    test('assigns rank in original data order when scoredSearch is off', () => {
      const engine = new YatlSearchEngine<{ id: number; text: string }>({
        data: [
          { id: 1, text: 'application' },
          { id: 2, text: 'app' },
          { id: 3, text: 'apple' },
        ],
        fields: [{ field: 'text' }],
        scoredSearch: false,
      });

      const results = engine.search('app');
      expect(results.map(r => r.rank)).toEqual([0, 1, 2]);
    });
  });

  // #endregion
  // #region Tokenized search

  describe('tokenizedSearch', () => {
    test('matches words regardless of order once tokenizedSearch is enabled', () => {
      const data = [
        { id: 1, bio: 'quick brown fox' },
        { id: 2, bio: 'brown quick fox' },
      ];
      const engine = new YatlSearchEngine<(typeof data)[number]>({
        data,
        fields: [{ field: 'bio' }],
        tokenizedSearch: true,
      });

      const results = engine.search('quick brown');
      expect(results.map(r => r.item.id).sort()).toEqual([1, 2]);
    });

    test('a quoted phrase requires an exact substring match, not independently-matched words', () => {
      const data = [
        { id: 1, bio: 'quick brown fox' },
        { id: 2, bio: 'brown quick fox' },
      ];
      const engine = new YatlSearchEngine<(typeof data)[number]>({
        data,
        fields: [{ field: 'bio' }],
        tokenizedSearch: true,
      });

      const results = engine.search('"quick brown"');
      expect(results.map(r => r.item.id)).toEqual([1]);
    });

    test('a custom per-column searchTokenizer overrides the engine tokenizer', () => {
      const customTokenizer = vi.fn((value: string) => [
        { value, quoted: false },
      ]);
      const engine = new YatlSearchEngine<{ id: number; text: string }>({
        data: [{ id: 1, text: 'foo-bar' }],
        fields: [
          { field: 'text', tokenize: true, searchTokenizer: customTokenizer },
        ],
        tokenizedSearch: true,
      });

      engine.search('foo');
      expect(customTokenizer).toHaveBeenCalled();
    });
  });

  // #endregion
  // #region Custom getter

  describe('custom getter', () => {
    test('uses the field-level getter instead of getNestedValue', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [
          {
            field: 'name',
            getter: (row: Person) => `${row.name} (${row.age})`,
          },
        ],
      });

      const results = engine.search('30');
      expect(results.map(r => r.item.id)).toEqual([1]);
    });

    test('does not call the getter again during search once the value is cached', () => {
      const getter = vi.fn((row: Person) => row.name);
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name', getter }],
      });
      getter.mockClear(); // ignore calls made while building the initial cache

      engine.search('alice');

      // search() should rely entirely on the already-cached value - it
      // shouldn't call the getter again just to type-check something
      // that's already been resolved and cached.
      expect(getter).not.toHaveBeenCalled();
    });
  });

  // #endregion
  // #region Cache invalidation

  describe('cache invalidation', () => {
    test('reassigning data rebuilds the cache', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }],
      });
      expect(engine.search('alice')).toHaveLength(1);

      engine.data = [{ id: 4, name: 'Dave', bio: '', age: 40 }];
      expect(engine.search('alice')).toHaveLength(0);
      expect(engine.search('dave')).toHaveLength(1);
    });

    test('updateCache reflects a mutated row without reassigning data', () => {
      const data = getData();
      const engine = new YatlSearchEngine<Person>({
        data,
        fields: [{ field: 'name' }],
      });
      expect(engine.search('zach')).toHaveLength(0);

      data[0].name = 'Zach';
      engine.updateCache(data[0]);

      expect(engine.search('zach')).toHaveLength(1);
    });
  });

  // #endregion
  // #region keys

  describe('keys', () => {
    test('reflects the registered search fields', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }, { field: 'bio' }],
      });

      expect(engine.keys).toEqual(['name', 'bio']);
    });
  });

  // #endregion
  // #region Bug regression: empty quoted query segment

  describe('empty quoted query segment', () => {
    test('does not hang and matches nothing for a lone empty quoted query', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }],
        tokenizedSearch: true,
      });

      // A literal `""` tokenizes to an empty-value quoted token. Before the
      // fix, String.prototype.indexOf('', n) never returns -1, so scanning
      // for it in addRangesFromValue looped forever.
      const results = engine.search('""');
      expect(results).toEqual([]);
    });

    test('an empty quoted segment does not break matching the rest of the query', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'name' }],
        tokenizedSearch: true,
      });

      const results = engine.search('alice ""');
      expect(results.map(r => r.item.id)).toEqual([1]);
    });

    test('does not hang with an empty quoted segment under scoredSearch and tokenized columns', () => {
      const engine = new YatlSearchEngine<Person>({
        data: getData(),
        fields: [{ field: 'bio', tokenize: true }],
        tokenizedSearch: true,
        scoredSearch: false,
      });

      expect(() => engine.search('hiking ""')).not.toThrow();
    });
  });

  // #endregion
});
