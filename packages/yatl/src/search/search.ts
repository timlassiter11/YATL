import { NestedKeyOf, UnspecifiedRecord } from '../types';
import {
  YatlFieldSearchOptions,
  MatchIndex,
  QueryToken,
  YatlSearchOptions,
  YatlSearchResult,
} from '../types/search';
import { getNestedValue, whitespaceTokenizer } from '../utils';

const MATCH_WEIGHTS = {
  EXACT: 100,
  PREFIX: 50,
  SUBSTRING: 10,
};

type ValueCacheEntry<T> = Partial<Record<NestedKeyOf<T>, string>>;
type TokenCacheEntry<T> = Partial<Record<NestedKeyOf<T>, string[]>>;
interface CacheEntry<T> {
  values: ValueCacheEntry<T>;
  tokens: TokenCacheEntry<T>;
}

export class YatlSearchEngine<T extends object = UnspecifiedRecord> {
  private _data: T[] = [];
  private _fields = new Map<NestedKeyOf<T>, YatlFieldSearchOptions<T>>();
  private _scoredSearch = false;
  private _tokenizedSearch = false;
  private _tokenizer = whitespaceTokenizer;
  private cache = new WeakMap<T, CacheEntry<T>>();

  constructor(options?: YatlSearchOptions<T>) {
    if (options?.data !== undefined) {
      this.data = options.data;
    }
    if (options?.fields !== undefined) {
      this.searchFields = options.fields;
    }
    if (options?.scoredSearch !== undefined) {
      this._scoredSearch = options.scoredSearch;
    }
    if (options?.tokenizedSearch !== undefined) {
      this._tokenizedSearch = options.tokenizedSearch;
    }
    if (options?.tokenizer !== undefined) {
      this._tokenizer = options.tokenizer;
    }
  }

  public get data() {
    return this._data;
  }

  public set data(value) {
    this._data = value;
    this.rebuildCache();
  }

  public get searchFields() {
    return [...this._fields.values()];
  }

  public set searchFields(value) {
    for (const field of value) {
      this._fields.set(field.field, field);
    }
    this.rebuildCache();
  }

  public get scoredSearch() {
    return this._scoredSearch;
  }

  public set scoredSearch(value) {
    if (this._scoredSearch === value) {
      return;
    }
    this._scoredSearch = value;
    this.rebuildCache();
  }

  public get tokenizedSearch() {
    return this._tokenizedSearch;
  }

  public set tokenizedSearch(value) {
    if (this._tokenizedSearch === value) {
      return;
    }
    this._tokenizedSearch = value;
    this.rebuildCache();
  }

  public get tokenizer() {
    return this._tokenizer;
  }

  public set tokenizer(value) {
    if (this._tokenizer === value) {
      return;
    }
    this._tokenizer = value;
    this.rebuildCache();
  }

  public get keys() {
    return [...this._fields.keys()];
  }

  public updateCache(...items: T[]) {
    for (const item of items) {
      this.cache.delete(item);
      this.getOrCreateCacheEntry(item);
    }
  }

  public search(query: string, subset?: T[]): YatlSearchResult<T>[] {
    const data = subset ?? this.data;
    if (query.length === 0) {
      return data.map((item, index) => ({
        item,
        score: 0,
        rank: index,
        matches: {},
      }));
    }

    const queryTokens = [{ value: query.toLocaleLowerCase(), quoted: true }];

    if (this.tokenizedSearch) {
      queryTokens.push(...this.tokenizer(query));
    }

    const results = [];
    for (const item of data) {
      const searchResult: YatlSearchResult<T> = {
        item: item,
        score: 0,
        rank: 0,
        matches: {},
      };
      const cacheEntry = this.getOrCreateCacheEntry(item);
      for (const key of this.keys) {
        const rowMatches = searchResult.matches;
        if (!(key in rowMatches)) {
          rowMatches[key] = [];
        }
        const fieldMatches = searchResult.matches[key]!;
        const columnOptions = this._fields.get(key);
        const getter = columnOptions?.getter ?? getNestedValue;
        const originalValue = getter(item, key);
        const compareValue = cacheEntry?.values[key];
        const columnTokens = cacheEntry.tokens[key];

        if (
          typeof originalValue !== 'string' ||
          typeof compareValue !== 'string'
        ) {
          continue;
        }

        for (const token of queryTokens) {
          const results = this.searchField(token, compareValue, columnTokens);
          searchResult.score += results.score;
          fieldMatches.push(...results.matches);
        }
      }

      if (searchResult.score > 0) {
        results.push(searchResult);
      }
    }

    if (this.scoredSearch) {
      results.sort((a, b) => b.score - a.score);
    }

    results.forEach((r, i) => (r.rank = i));

    return results;
  }

  /**
   * Calculates a relevance score for a given query against a target string.
   *
   * This function implements a tiered matching strategy:
   * 1.  **Exact Match**: The query exactly matches the target. This yields the highest score.
   * 2.  **Prefix Match**: The target starts with the query. This is the next most relevant.
   * 3.  **Substring Match**: The target contains the query somewhere. This is the least relevant.
   *
   * The final score is weighted and adjusted by the length difference between the query and the target
   * to ensure that more specific matches (e.g., "apple" vs "application" for the query "apple") rank higher.
   *
   * @param query The search term (e.g., "app").
   * @param target The string to be searched (e.g., "Apple" or "Application").
   * @returns A numerical score representing the relevance of the match. Higher is better. Returns 0 if no match is found.
   */
  private calculateSearchScore(
    query: string,
    target: string,
  ): FieldSearchResult {
    const results: FieldSearchResult = { score: 0, matches: [] };

    if (!query || !target) {
      return results;
    }

    let baseScore = 0;
    let matchTypeWeight = 0;

    if (target === query) {
      matchTypeWeight = MATCH_WEIGHTS.EXACT;
      baseScore = query.length;
      results.matches.push({ start: 0, end: target.length });
    } else if (target.startsWith(query)) {
      matchTypeWeight = MATCH_WEIGHTS.PREFIX;
      baseScore = query.length;
      results.matches.push({ start: 0, end: query.length });
    } else {
      const index = target.indexOf(query);
      if (index !== -1) {
        matchTypeWeight = MATCH_WEIGHTS.SUBSTRING;
        baseScore = query.length;

        let cursor = index;
        while (cursor !== -1) {
          results.matches.push({ start: cursor, end: cursor + query.length });
          cursor = target.indexOf(query, cursor + 1);
        }
      } else {
        return results;
      }
    }

    // Reward matches where the query length is close to the target length.
    const lengthDifference = target.length - query.length;
    const specificityBonus = 1 / Math.sqrt(1 + lengthDifference);
    // The final score is a combination of the match type's importance,
    // the base score from the query length, and the specificity bonus.
    results.score = baseScore * matchTypeWeight * specificityBonus;
    return results;
  }

  private searchField(
    query: QueryToken,
    value: string,
    tokens?: string[],
  ): FieldSearchResult {
    const result: FieldSearchResult = { score: 0, matches: [] };

    const addRangesFromValue = (searchTerm: string) => {
      let idx = value.indexOf(searchTerm);
      while (idx !== -1) {
        result.matches.push({ start: idx, end: idx + searchTerm.length });
        idx = value.indexOf(searchTerm, idx + 1);
      }
    };

    // Handle Quoted/Untokenized (Direct Search)
    if (query.quoted || !tokens) {
      if (!this.scoredSearch) {
        // Simple boolean match
        if (value.includes(query.value)) {
          result.score = 1;
          addRangesFromValue(query.value);
        }
      } else {
        // Scored match
        const calculation = this.calculateSearchScore(query.value, value);
        result.score = calculation.score;
        result.matches = calculation.matches;
      }
      return result;
    }

    // Handle Tokenized Search
    // We search the tokens to check for validity/scoring,
    // but we map back to the 'value' for highlighting.
    if (!this.scoredSearch) {
      const isMatch = tokens.some(token => token.includes(query.value));
      if (isMatch) {
        result.score = 1;
        addRangesFromValue(query.value);
      }
      return result;
    }

    // Complex Scored Token Search
    // We sum the scores of all matching tokens
    let hasMatch = false;
    for (const token of tokens) {
      const calculation = this.calculateSearchScore(query.value, token);
      if (calculation.score > 0) {
        hasMatch = true;
        result.score += calculation.score;
      }
    }

    if (hasMatch) {
      // If a token matched, find that query in the main string
      addRangesFromValue(query.value);
    }

    return result;
  }

  private rebuildCache() {
    this.cache = new WeakMap();
    for (const item of this.data) {
      this.getOrCreateCacheEntry(item);
    }
  }

  private getOrCreateCacheEntry(item: T) {
    let cacheEntry = this.cache.get(item);
    if (!cacheEntry) {
      cacheEntry = { values: {}, tokens: {} };
      for (const key of this.keys) {
        const columnOptions = this._fields.get(key);
        const getter = columnOptions?.getter ?? getNestedValue;
        const rawValue = getter(item, key);
        if (typeof rawValue === 'string') {
          const lowerValue = rawValue.toLocaleLowerCase();
          cacheEntry.values[key] = lowerValue;

          if (columnOptions?.tokenize) {
            const tokenizer = columnOptions.searchTokenizer ?? this.tokenizer;
            cacheEntry.tokens[key] = tokenizer(lowerValue).map(t => t.value);
          }
        }
      }
      this.cache.set(item, cacheEntry);
    }
    return cacheEntry;
  }
}

interface FieldSearchResult {
  score: number;
  matches: MatchIndex[];
}
