import { css } from 'lit';

/**
 * we separate the CSS variable names between internal '--yatl' and external '--yatl-table'
 * so that way users can more easily customize the table. Instead of having to apply the
 * overrides to the element itself, they can apply them to the root. So DON'T think this
 * is overly complicated and should be cleaned up by combining the --yatl-* and --yatl-table-* variables.
 */
export default css`
  /* Theme declarations */
  :host {
    /* Typography */
    --yatl-font-family: var(
      --yatl-theme-font,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Helvetica,
      Arial,
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji'
    );
    --yatl-font-size: var(--yatl-theme-font-size, 0.875rem);
    --yatl-line-height: var(--yatl-theme-line-height, 1.25rem);

    /* Spacing */
    --yatl-spacing-xs: var(--yatl-theme-spacing-xs, 4px);
    --yatl-spacing-s: var(--yatl-theme-spacing-s, 8px);
    --yatl-spacing-m: var(--yatl-theme-spacing-m, 12px);
    --yatl-spacing-l: var(--yatl-theme-spacing-l, 16px);

    /* Radius */
    --yatl-radius-xs: var(--yatl-theme-radius-xs, 2px);
    --yatl-radius-s: var(--yatl-theme-radius-s, 4px);
    --yatl-radius-m: var(--yatl-theme-radius-m, 8px);
    --yatl-radius-l: var(--yatl-theme-radius-l, 12px);

    /* Border */
    --yatl-border-color-light: var(--yatl-theme-border-color-light, #e2e8f0);
    --yatl-border-color-dark: var(--yatl-theme-border-color-dark, #2e2e2e);
    --yatl-border-color: light-dark(
      var(--yatl-border-color-light),
      var(--yatl-border-color-dark)
    );

    --yatl-color-brand: var(--yatl-theme-brand, #7531ae);
    --yatl-color-danger: var(--yatl-theme-danger, #ef4444);

    --yatl-surface-1-light: #ffffff;
    --yatl-surface-1-dark: #101219;
    --yatl-surface-1: light-dark(
      var(--yatl-surface-1-light),
      var(--yatl-surface-1-dark)
    );

    --yatl-surface-2-light: #f8fafc;
    --yatl-surface-2-dark: #1a1b1e;
    --yatl-surface-2: light-dark(
      var(--yatl-surface-2-light),
      var(--yatl-surface-2-dark)
    );

    --yatl-surface-3-light: #f1f5f9;
    --yatl-surface-3-dark: #27272a;
    --yatl-surface-3: light-dark(
      var(--yatl-surface-3-light),
      var(--yatl-surface-3-dark)
    );

    --yatl-surface-4-light: #e2e8f0;
    --yatl-surface-4-dark: #3f3f46;
    --yatl-surface-4: light-dark(
      var(--yatl-surface-4-light),
      var(--yatl-surface-4-dark)
    );

    --yatl-text-1-light: #0f172a;
    --yatl-text-1-dark: #f1f5f9;
    --yatl-text-1: light-dark(
      var(--yatl-text-1-light),
      var(--yatl-text-1-dark)
    );

    --yatl-text-2-light: #475569;
    --yatl-text-2-dark: #cbd5e1;
    --yatl-text-2: light-dark(
      var(--yatl-text-2-light),
      var(--yatl-text-2-dark)
    );

    --yatl-text-3-light: #4d4d4d;
    --yatl-text-3-dark: #c1c1c1;
    --yatl-text-3: light-dark(
      var(--yatl-text-3-light),
      var(--yatl-text-3-dark)
    );

    --yatl-text-inverse: #ffffff;
    --yatl-mix-color: light-dark(black, white);

    font-family: var(--yatl-font-family);
    font-size: var(--yatl-font-size);
    color: var(--yatl-text);
  }

  [part='base'] {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  :host([data-group-position]) {
    margin-right: -1px;
  }

  :host([data-group-position='middle']) {
    --button-radius: 0 !important;
  }

  :host([data-group-position='first']) {
    --button-radius: var(--button-group-radius) 0 0 var(--button-group-radius) !important;
  }

  :host([data-group-position='last']) {
    --yatl-button-radius: 0 var(--button-group-radius)
      var(--button-group-radius) 0;
    margin-right: 0;
  }
`;
