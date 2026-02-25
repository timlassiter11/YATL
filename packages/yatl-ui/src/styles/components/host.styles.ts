import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
  }

  :host([data-group-position]) {
    height: 100%;
  }

  :host([data-group-position='middle']) {
    --button-radius: 0 !important;
  }

  :host([data-group-position='first']) {
    --button-radius: var(--button-group-radius) 0 0 var(--button-group-radius);
  }

  :host([data-group-position='last']) {
    --button-radius: 0 var(--button-group-radius) var(--button-group-radius) 0;
  }

  :host([data-group-position='single']) {
    --button-radius: var(--button-group-radius);
  }
`;
