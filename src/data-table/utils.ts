import { TableClasses } from './types';

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type WithRequiredProp<Type, Key extends keyof Type> = Type &
  Required<Pick<Type, Key>>;

export const classesToArray = (classes: string[] | string | undefined) => {
  if (typeof classes === 'string' && classes !== '') {
    return classes.split(' ');
  } else if (Array.isArray(classes)) {
    return classes;
  } else if (!classes) {
    return [];
  }
  throw new TypeError('classes must be string or array of strings');
};

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

export function virtualScrollToNumber(virtualScroll: boolean | number) {
  if (typeof virtualScroll === 'boolean') {
    return virtualScroll ? 1 : Number.MAX_SAFE_INTEGER;
  }
  return virtualScroll;
}

export function convertClasses(
  defaultClasses: TableClasses,
  userClasses: TableClasses = {},
) {
  return {
    scroller: [
      ...classesToArray(userClasses.scroller),
      ...classesToArray(defaultClasses.scroller),
    ],
    thead: [
      ...classesToArray(userClasses.thead),
      ...classesToArray(defaultClasses.thead),
    ],
    tbody: [
      ...classesToArray(userClasses.tbody),
      ...classesToArray(defaultClasses.tbody),
    ],
    tr: [
      ...classesToArray(userClasses.tr),
      ...classesToArray(defaultClasses.tr),
    ],
    th: [
      ...classesToArray(userClasses.th),
      ...classesToArray(defaultClasses.th),
    ],
    td: [
      ...classesToArray(userClasses.td),
      ...classesToArray(defaultClasses.td),
    ],
    mark: [
      ...classesToArray(userClasses.mark),
      ...classesToArray(defaultClasses.mark),
    ],
  };
}
