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

  [part='dropdown'] {
    position: relative;
    height: 100%;
  }

  [part='dropdown'] summary {
    box-sizing: border-box;
    /* Hides the dropdown arrow*/
    list-style: none;
    height: 100%;
  }

  :host([open]) ::slotted([slot='trigger']) {
    background-color: var(--dropdown-menu-open-bg);
  }

  [part='dropdown-menu'] {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--dropdown-menu-bg);
    border: 1px solid var(--dropdown-menu-border);
    border-radius: var(--dropdown-menu-radius);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    padding: var(--dropdown-menu-padding);
    z-index: 50;

    display: flex;
    flex-direction: column;
  }
`;
