import { css } from 'lit';

export default css`
  :host {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    overflow: hidden;
    width: fit-content;
  }

  .start::part(base) {
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
    border-right-width: 0px;
  }

  .end::part(base) {
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left-width: 0px;
  }
`;
