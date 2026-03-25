import { css } from 'lit';

export default css`
  .toolbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    yatl-button,
    yatl-button-group,
    yatl-button-group::part(base) {
      flex-grow: 1;
    }
  }
`;
