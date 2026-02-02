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
      --yatl-table-font,
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
    --yatl-font-size: var(--yatl-table-font-size, 0.875rem);
    --yatl-line-height: var(--yatl-table-line-height, 1.25rem);

    /* Spacing */
    --yatl-spacing-xs: var(--yatl-table-spacing-xs, 4px);
    --yatl-spacing-s: var(--yatl-table-spacing-s, 8px);
    --yatl-spacing-m: var(--yatl-table-spacing-m, 12px);
    --yatl-spacing-l: var(--yatl-table-spacing-l, 16px);

    --yatl-cell-padding: var(
      --yatl-table-cell-padding,
      var(--yatl-spacing-m) var(--yatl-spacing-m)
    );
    --yatl-header-padding: var(
      --yatl-table-header-padding,
      var(--yatl-spacing-m) var(--yatl-spacing-l)
    );

    --yatl-brand-color: var(--yatl-table-brand-light, #7531ae);

    /* Light colors */
    --yatl-bg-light: var(--yatl-table-bg-light, #ffffff);
    --yatl-text-light: var(--yatl-table-text-light, #0f172a);
    --yatl-text-muted-light: var(--yatl-table-text-muted-light, #64748b);
    --yatl-border-color-light: var(--yatl-table-border-color-light, #e2e8f0);
    --yatl-header-bg-light: var(
      --yatl-table-header-bg-light,
      color-mix(in srgb, black 5%, var(--yatl-bg))
    );
    --yatl-header-text-light: var(--yatl-table-header-text-light, #475569);
    --yatl-header-drop-bg-light: var(
      --yatl-table-drop-bg-light,
      color-mix(in srgb, black 5%, transparent)
    );
    --yatl-row-hover-bg-light: var(
      --yatl-table-row-hover-bg-light,
      color-mix(in srgb, black 5%, transparent)
    );
    --yatl-row-selected-bg-light: var(
      --yatl-table-row-selected-bg-light,
      color-mix(in srgb, var(--yatl-brand-color) 20%, transparent)
    );

    /* Dark colors */
    --yatl-bg-dark: var(--yatl-table-bg-dark, #101219);
    --yatl-text-dark: var(--yatl-table-text-dark, #f1f5f9);
    --yatl-text-muted-dark: var(--yatl-table-text-muted-dark, #94a3b8);
    --yatl-border-color-dark: var(--yatl-table-border-color-dark, #1a1b1e);
    --yatl-header-bg-dark: var(
      --yatl-table-header-bg-dark,
      color-mix(in srgb, white 5%, var(--yatl-bg))
    );
    --yatl-header-text-dark: var(--yatl-table-header-text-dark, #cbd5e1);
    --yatl-header-drop-bg-dark: var(
      --yatl-table-drop-bg-dark,
      color-mix(in srgb, white 5%, transparent)
    );
    --yatl-row-hover-bg-dark: var(
      --yatl-table-row-hover-bg-dark,
      color-mix(in srgb, white 5%, transparent)
    );
    --yatl-row-selected-bg-dark: var(
      --yatl-table-row-selected-bg-dark,
      color-mix(in srgb, var(--yatl-brand-color) 20%, transparent)
    );

    /* Applied colors */
    --yatl-bg: var(
      --yatl-table-bg,
      light-dark(var(--yatl-bg-light), var(--yatl-bg-dark))
    );
    --yatl-text: var(
      --yatl-table-text,
      light-dark(var(--yatl-text-light), var(--yatl-text-dark))
    );
    --yatl-text-muted: var(
      --yatl-table-text-muted,
      light-dark(var(--yatl-text-muted-light), var(--yatl-text-muted-dark))
    );
    --yatl-border-color: var(
      --yatl-table-border-color,
      light-dark(var(--yatl-border-color-light), var(--yatl-border-color-dark))
    );
    --yatl-header-bg: var(
      --yatl-table-header-bg,
      light-dark(var(--yatl-header-bg-light), var(--yatl-header-bg-dark))
    );
    --yatl-header-text: var(
      --yatl-table-header-text,
      light-dark(var(--yatl-header-text-light), var(--yatl-header-text-dark))
    );
    --yatl-header-drop-bg: var(
      --yatl-table-header-drop-bg,
      light-dark(
        var(--yatl-header-drop-bg-light),
        var(--yatl-header-drop-bg-dark)
      )
    );
    --yatl-row-hover-bg: var(
      --yatl-table-row-hover-bg,
      light-dark(var(--yatl-row-hover-bg-light), var(--yatl-row-hover-bg-dark))
    );
    --yatl-row-selected-bg: var(
      --yatl-table-row-selected-bg,
      light-dark(
        var(--yatl-row-selected-bg-light),
        var(--yatl-row-selected-bg-dark)
      )
    );

    --yatl-row-number-column-width: var(
      --yatl-table-row-number-column-width,
      48px
    );
    --yatl-row-selector-column-width: var(
      --yatl-table-row-selector-column-width,
      48px
    );
    --yatl-column-visibility-transition: var(
      --yatl-table-column-visibility-transition,
      100ms
    );

    --yatl-table-radius: var(--yatl-table-table-radius, 8px);
    --yatl-input-radius: var(--yatl-table-input-radius, 8px);
    --yatl-button-radius: var(--yatl-table-button-radius, 8px);
    --yatl-button-group-radius: var(--yatl-table-button-group-radius, 8px);
    --yatl-input-padding: var(
      --yatl-table-input-padding,
      var(--yatl-spacing-m)
    );

    font-family: var(--yatl-font-family);
    font-size: var(--yatl-font-size);
    color: var(--yatl-text);
  }
`;
