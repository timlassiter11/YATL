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
