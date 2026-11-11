import { css } from 'lit';

/**
 * Shared sizes for components with a `size` property, so a small button
 * and a small input line up. Text gets more padding at the sides (inline)
 * than above and below (block); `--yatl-size-padding` has both.
 *
 * Height is the line height plus the block padding plus a 1px border, so a
 * button and an input of the same size are the same height.
 */
export default css`
  /* Medium, also for any other size value (yatl-search-select's size is a
     row count), so the variables are never left unset */
  :host {
    --yatl-size-padding-block: var(--yatl-spacing-s);
    --yatl-size-padding-inline: 14px;
    --yatl-size-font-size: var(--yatl-font-size);
    --yatl-size-padding: var(--yatl-size-padding-block)
      var(--yatl-size-padding-inline);
    --yatl-size-line-height: 1.2;
    --yatl-size-border-width: 1px;
  }

  :host([size='small']) {
    --yatl-size-padding-block: var(--yatl-spacing-xs);
    --yatl-size-padding-inline: 10px;
    --yatl-size-font-size: var(--yatl-font-size-s);
  }

  :host([size='large']) {
    --yatl-size-padding-block: var(--yatl-spacing-m);
    --yatl-size-padding-inline: var(--yatl-spacing-xl);
    --yatl-size-font-size: var(--yatl-font-size-l);
  }
`;
