import { css } from 'lit';

export default css`
  :host {
    resize: none;
  }

  [part='base'] {
    height: 100%;
    width: 100%;
  }

  .text-input {
    max-width: 100%;
    height: 100%;
  }

  textarea {
    resize: inherit;
  }
`;
