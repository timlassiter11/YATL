import { css } from 'lit';

export default css`
  :host {
    --yatl-dropdown-item-padding: var(
      --yatl-table-dropdown-item-padding,
      0.5em 1em
    );
    --yatl-dropdown-item-font-size: var(
      --yatl-table-dropdown-item-font-size,
      16px
    );
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--yatl-spacing-xs);
    color: var(--yatl-text);
    padding: var(--yatl-dropdown-item-padding);
    cursor: pointer;
    white-space: nowrap;
    font-size: var(--yatl-dropdown-item-font-size);
    user-select: none;
    transition: background 0.1s ease;
  }

  .dropdown-item:hover {
    background-color: var(--yatl-brand-color);
    border-radius: 4px;
  }

  .dropdown-item input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .check-container {
    width: 18px;
    height: 18px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .check-icon {
    width: 14px;
    height: 14px;
    fill: var(--yatl-text);
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46);
  }

  input:checked ~ .check-container .check-icon {
    opacity: 1;
    transform: scale(1);
  }

  input:focus-visible ~ .check-container {
    border-color: var(--yatl-brand-color);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .label-text {
    font-size: 14px;
    color: var(--yatl-text);
  }
`;
