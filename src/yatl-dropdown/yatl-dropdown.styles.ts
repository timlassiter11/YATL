import { css } from 'lit';

export default css`
  :host {
    --dropdown-menu-bg: var(--yatl-dropdown-menu-bg, var(--yatl-surface-3));
    --dropdown-menu-padding: var(
      --yatl-dropdown-menu-padding,
      var(--yatl-spacing-s)
    );
    --dropdown-menu-radius: var(
      --yatl-dropdown-menu-radius,
      var(--yatl-radius-m)
    );
    --dropdown-menu-border: var(
      --yatl-dropdown-menu-border,
      var(--yatl-border-color)
    );
    --dropdown-menu-open-bg: var(
      --yatl-dropdown-menu-open-bg,
      var(--yatl-color-brand)
    );

    overflow: visible !important;
  }

  [part='base'] {
    position: relative;
    height: 100%;
  }

  [part='base'] summary {
    box-sizing: border-box;
    /* Hides the dropdown arrow*/
    list-style: none;
    height: 100%;
  }

  :host([open]) ::slotted(yatl-button[slot='trigger']) {
    background-color: var(--dropdown-menu-open-bg);
  }

  [part='trigger'] {
    display: contents;
  }

  :host([open]) [part='menu'] {
    display: flex;
  }

  [part='menu'] {
    position: absolute;
    top: 0;
    left: 0;
    width: max-content;
    box-sizing: border-box;
    z-index: 1000;
    background: var(--dropdown-menu-bg);
    border: 1px solid var(--dropdown-menu-border);
    border-radius: var(--dropdown-menu-radius);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    padding: var(--dropdown-menu-padding);
    display: none;
    flex-direction: column;
  }
`;
