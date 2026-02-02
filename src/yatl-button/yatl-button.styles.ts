import { css } from 'lit';

export default css`
  :host {
    --yatl-button-radius: var(--yatl-table-button-radius, 4px);

    display: block;
    box-sizing: border-box;
    border-radius: var(--yatl-button-radius);
    overflow: hidden;
    padding: 0;
    border: 1px solid var(--yatl-border-color);
    background: var(--yatl-header-bg);
    font-size: large;
    font-weight: 500;
    color: var(--yatl-text);
  }
  
  .button{
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 8px;
    border: none;
    cursor: pointer;
    background-color: transparent;
    /* Helps center the icons */
    display: flex;
    align-items: center;
  }

  .button:not([disabled]):hover {
    background: var(--yatl-brand-color);
  }

  .button:disabled,
  .button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(100%);
    pointer-events: none;
  }
`;
