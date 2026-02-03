import { html, TemplateResult } from 'lit';

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
