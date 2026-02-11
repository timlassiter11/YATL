import { css } from 'lit';

export default css`
  :host {
    display: inline-flex;
  }

  [part='base'] {
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }

  ::slotted(*) {
    --button-group-radius: var(
      --yatl-button-group-radius,
      var(--yatl-radius-m)
    );
  }
`;
