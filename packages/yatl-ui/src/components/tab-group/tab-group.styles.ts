import { css } from 'lit';

export default css`
  /* Slotted tabs and panels need to know the current styles */
  :host,
  ::slotted(*) {
    --tabs-border-width: var(--yatl-tab-group-separator-width, 2px);
    --tabs-border-color: var(
      --yatl-tab-group-separator-color,
      var(--yatl-border-color)
    );
    --tabs-border-style: var(--yatl-tab-group-separator-style, solid);
  }

  :host {
    display: flex;
    flex-direction: column;
  }

  [part='tabs'] {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-end;
    border-bottom-width: var(--tabs-border-width);
    border-bottom-color: var(--tabs-border-color);
    border-bottom-style: var(--tabs-border-style);
    flex: 0 0 0%;
  }

  [part='body'] {
    flex: 1 1 100%;
    overflow: hidden;
  }
`;
