import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host([data-group-position]) {
    height: 100%;
  }

  :host([data-group-position='middle']) {
    border-left: none;
    border-right: none;
    --yatl-button-radius: 0 !important;
  }

  :host([data-group-position='first']) {
    border-right: none;
    --yatl-button-radius: var(--button-group-radius) 0 0
      var(--button-group-radius);
  }

  :host([data-group-position='last']) {
    border-left: none;
    --yatl-button-radius: 0 var(--button-group-radius)
      var(--button-group-radius) 0;
  }

  :host([data-group-position='single']) {
    --yatl-button-radius: var(--button-group-radius);
  }
`;
