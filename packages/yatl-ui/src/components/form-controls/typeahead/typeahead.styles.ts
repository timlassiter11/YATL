import { css } from 'lit';

export default css`
  yatl-dropdown {
    width: 100%;
    height: 100%;
  }

  yatl-option::part(label) {
    color: var(--yatl-text-2);
  }

  yatl-option::part(mark) {
    color: var(--yatl-text-1);
    background-color: transparent;
    font-weight: 700;
  }
`;
