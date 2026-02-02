import { css } from 'lit';

export default css`
  :host {
    display: inline-flex;
    --yatl-button-group-radius: var(--yatl-table-button-group-radius, 8px);
  }

  .group-container {
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }

  ::slotted(*:not(:first-child):not(:last-child)) {
    --yatl-table-button-radius: 0;
  }

  ::slotted(:first-child) {
    --yatl-table-button-radius: var(--yatl-button-group-radius) 0 0
      var(--yatl-button-group-radius);
  }

  ::slotted(:last-child) {
    --yatl-table-button-radius: 0 var(--yatl-button-group-radius)
      var(--yatl-button-group-radius) 0;
    margin-right: 0;
  }

  ::slotted(*) {
    margin-right: -1px;
  }
`;
