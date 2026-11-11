import { css } from 'lit';

export default css`
  /* The picker's columns scroll on their own, so the menu doesn't */
  yatl-dropdown::part(menu) {
    overflow: hidden;
  }
`;
