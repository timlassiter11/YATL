import { css } from 'lit';

export default css`
  :host {
    display: none;
  }

  :host([active]) {
    display: block;
  }
`;
