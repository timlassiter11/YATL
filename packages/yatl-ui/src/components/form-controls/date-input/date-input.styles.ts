import { css } from 'lit';

export default css`
  yatl-dropdown {
    width: 100%;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    flex: 1 1 0%;
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
    padding-block: 0px;
    border: none;
    outline: none;
    box-shadow: none;
    color: inherit;
    background-color: transparent;
    appearance: none;
    text-align: start;
    cursor: inherit;
    font: inherit;
  }

  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    gap: var(--yatl-spacing-xs);
    padding-top: var(--yatl-spacing-m);
  }

  .footer > *:first-child {
    margin-right: auto;
  }

  .has-placeholder {
    color: var(--yatl-text-2);
  }
`;
