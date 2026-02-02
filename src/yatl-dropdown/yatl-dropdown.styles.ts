import { css } from 'lit';

export default css`
  :host {
    --yatl-dropdown-menu-bg: var(
      --yatl-table-dropdown-menu-bg,
      var(--yatl-header-bg)
    );
    --yatl-dropdown-menu-padding: var(
      --yatl-table-dropdown-menu-padding,
      0.25em
    );
    --yatl-dropdown-menu-radius: var(--yatl-table-dropdown-menu-radius, 8px);
    --yatl-dropdown-menu-border: var(
      --yatl-table-dropdown-menu-border,
      var(--yatl-border-color)
    );
    
    overflow: visible !important;
  }

  .dropdown {
    position: relative;
    height: 100%;
  }

  .dropdown summary {
    box-sizing: border-box;
    /* Hides the dropdown arrow*/
    list-style: none;
    height: 100%;
  }

  :host([open]) ::slotted([slot='trigger']) {
    background-color: var(--yatl-brand-color);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--yatl-dropdown-menu-bg);
    border: 1px solid var(--yatl-dropdown-menu-border);
    border-radius: var(--yatl-dropdown-menu-radius);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    padding: var(--yatl-dropdown-menu-padding);
    z-index: 50;

    display: flex;
    flex-direction: column;
  }
`;
