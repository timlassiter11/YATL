import { css } from 'lit';

export default css`
  :host {
    --border-width: var(--yatl-details-border-width, 1px);
    --border-style: var(--yatl-details-border-style, solid);
    --border-color: var(--yatl-details-border-color, var(--yatl-border-color));
    --border-radius: var(--yatl-details-border-radius, var(--yatl-radius-m));

    --header-border-width: var(--yatl-details-header-border-width, 1px);
    --header-border-style: var(--yatl-details-header-border-style, solid);
    --header-border-color: var(
      --yatl-details-header-border-color,
      var(--yatl-border-color)
    );

    --spacing: var(--yatl-details-spacing, var(--yatl-spacing-l));

    --open-speed: var(--yatl-details-open-speed, 0.5s);
    --open-curve: var(--yatl-details-open-curve, var(--ease-spring-3));
    --close-speed: var(--yatl-details-close-speed, 0.2s);
    --close-curve: var(--yatl-details-close-curve, var(--ease-3));

    flex-grow: 0;
    transition: flex-grow var(--close-speed) var(--close-curve);
  }

  :host([open]) {
    flex-grow: 1;
    transition: flex-grow var(--open-speed) var(--open-curve);
  }

  details {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-width: var(--border-width);
    border-style: var(--border-style);
    border-color: var(--border-color);
    border-radius: var(--border-radius);
  }

  [part='header'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    padding: var(--spacing);
  }

  :host([open]) [part='header'] {
    border-bottom-width: var(--header-border-width);
    border-bottom-style: var(--header-border-style);
    border-bottom-color: var(--header-border-color);
  }

  [part='body'] {
    padding: var(--spacing);
    overflow: hidden;
    box-sizing: border-box;
    height: 100%;
  }

  [part='arrow-icon'] {
    transform: rotate(-90deg);
    transition: transform var(--close-speed) var(--close-curve);
  }

  :host([open]) [part='arrow-icon'] {
    transform: rotate(0deg);
    transform: transform var(--open-speed) var(--open-curve);
  }

  details::details-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--close-speed) var(--close-curve),
      content-visibility var(--close-speed) allow-discrete;
  }

  details[open]::details-content {
    grid-template-rows: 1fr;
    transition: grid-template-rows var(--open-speed) var(--open-curve),
      content-visibility var(--open-speed) allow-discrete;
  }
`;
