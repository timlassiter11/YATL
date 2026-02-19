import { css } from 'lit';

export default css`
  :host {
    --padding: var(--yatl-tab-padding, var(--yatl-spacing-l));
    --color: var(--yatl-tab-color, var(--yatl-text-1));
    --font-size: var(--yatl-tab-font-size, 1.25em);
    --font-weight: var(--yatl-tab-font-weight, inherit);
    --active-color: var(--yatl-tab-active-color, var(--yatl-color-brand));
    --active-separator-color: var(
      --yatl-tab-active-separator-color,
      var(--active-color)
    );

    margin-bottom: calc(var(--tabs-border-width) * -1);
    padding: var(--padding);
    color: var(--color);
    font-size: var(--font-size);
    font-weight: var(--font-weight);
    cursor: pointer;
  }

  :host([active]) {
    color: var(--active-color);
    border-bottom-width: 2px;
    border-bottom-style: solid;
    border-bottom-color: var(--active-separator-color);
  }

  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
