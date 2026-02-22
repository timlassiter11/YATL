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
    --close-speed: var(--yatl-details-close-speed, 0.2s);

    /* Allows our anmiation to work */
    interpolate-size: allow-keywords;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    overflow-anchor: none;
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
    flex: 1;
    padding: var(--spacing);
  }

  [part='arrow-icon'] {
    transition: transform 200ms ease;
  }

  :host(:not([open])) [part='arrow-icon'] {
    transform: rotate(-90deg);
  }

  details::details-content {
    height: 0;
    overflow: hidden;

    transition: height var(--close-speed) var(--ease-3),
      content-visibility 0.4s allow-discrete;
  }

  details[open]::details-content {
    height: auto;
    transition: height var(--open-speed) var(--ease-spring-2),
      content-visibility 0.5s allow-discrete;
  }
`;
