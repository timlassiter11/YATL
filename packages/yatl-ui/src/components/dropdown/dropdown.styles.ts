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
      var(--yatl-border-color-strong)
    );
    --dropdown-menu-open-bg: var(
      --yatl-dropdown-menu-open-bg,
      var(--yatl-color-brand)
    );
    --dropdown-menu-shadow: var(--yatl-dropdown-menu-shadow, var(--shadow-4));

    overflow: visible !important;
  }

  [part='base'] {
    position: relative;
    height: 100%;
  }

  [part='menu'] {
    position: fixed;
    top: 0;
    left: 0;
    width: max-content;
    box-sizing: border-box;
    z-index: 1000;
    background: var(--dropdown-menu-bg);
    border: 1px solid var(--dropdown-menu-border);
    border-radius: var(--dropdown-menu-radius);
    box-shadow: var(--dropdown-menu-shadow);
    padding: var(--dropdown-menu-padding);
    display: none;
    flex-direction: column;
    overflow-y: auto;
  }

  :host([open]) ::slotted(yatl-button[slot='trigger']) {
    --yatl-button-bg: var(--dropdown-menu-open-bg);
  }

  [part='trigger'] {
    display: contents;
  }

  :host([open]) [part='menu'] {
    display: flex;
  }
`;
