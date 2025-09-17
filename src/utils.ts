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

/**
 * Tokenizes a string into an array of lowercase words separated by whitespace.
 */
export const whitespaceTokenizer = (value: string) => {
  const regex = /"[^"]*"|\S+/g;
  
  // Find all matches, which will include the quotes
  const matches = value.match(regex) || [];
  
  // Clean up the results by removing the surrounding quotes
  return matches.map(token => {
    if (token.startsWith('"') && token.endsWith('"')) {
      return token.slice(1, -1);
    }
    return token;
  });
}
