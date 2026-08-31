import { css } from 'lit';

export default css`
  :host {
    resize: none;
  }

  [part='base'] {
    height: 100%;
    width: 100%;
    max-width: 100%;
  }

  textarea {
    resize: inherit;
  }
`;
