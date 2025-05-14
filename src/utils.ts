export const classesToArray = (classes: string[] | string | undefined) => {
  if (typeof classes === "string") {
    return classes.split(" ");
  } else if (Array.isArray(classes)) {
    return classes;
  } else if (classes == null) {
    return [];
  }
  throw new TypeError("classes must be string or array of strings");
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
  return str
    // Replace underscores with spaces
    .replace(/_/g, " ")
    // Insert spaces before uppercase letters (for camelCase)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Capitalize the first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Tokenizes a string into an array of lowercase words separated by whitespace.
 */
export const whitespaceTokenizer = (value: any) =>
    String(value)
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .trim()
      .split(/\s+/);