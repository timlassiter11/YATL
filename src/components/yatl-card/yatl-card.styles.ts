import { css } from 'lit';

export default css`
  :host {
    --card-bg: var(--yatl-card-bg, var(--yatl-surface-1));
    --card-color: var(--yatl-card-color, var(--yatl-text-1));
    --card-spacing: var(--yatl-card-spacing, var(--yatl-spacing-m));

    --card-border-width: var(--yatl-card-border-width, 1px);
    --card-border-style: var(--yatl-card-border-style, solid);
    --card-border-color: var(
      --yatl-card-border-color,
      var(--yatl-border-color)
    );
    --card-border-radius: var(--yatl-card-border-radius, var(--yatl-radius-l));

    --card-header-font-size: var(--yatl-card-header-font-size, x-large);
    --card-header-font-wieght: var(--yatl-card-header-font-weight, 700);
    --card-header-padding: var(
      --yatl-card-header-padding,
      var(--yatl-spacing-m)
    );
    --card-header-border-width: var(
      --yatl-card-header-border-width,
      var(--card-border-width)
    );

    --card-footer-font-size: var(--yatl-card-footer-font-size, medium);
    --card-footer-font-weight: var(--yatl-card-footer-font-weight, normal);
    --card-footer-padding: var(
      --yatl-card-footer-padding,
      var(--yatl-spacing-m)
    );
    --card-footer-border-width: var(
      --yatl-card-footer-border-width,
      var(--card-border-width)
    );

    display: flex;
    flex-direction: column;

    color: var(--card-color);
    background-color: var(--card-bg);
    border-width: var(--card-border-width);
    border-style: var(--card-border-style);
    border-color: var(--card-border-color);
    border-radius: var(--card-border-radius);
  }

  [part='header'],
  [part='footer'] {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  [part='header'] {
    font-size: var(--card-header-font-size);
    font-weight: var(--card-header-font-wieght);

    padding: var(--card-header-padding);
    border-block-end-width: var(--card-header-border-width);
    border-block-end-style: var(--card-border-style);
    border-block-end-color: var(--card-border-color);
  }

  [part='footer'] {
    font-size: var(--card-footer-font-size);
    font-weight: var(--card-footer-font-weight);

    padding: var(--card-footer-padding);
    border-block-start-width: var(--card-footer-border-width);
    border-block-start-style: var(--card-border-style);
    border-block-start-color: var(--card-border-color);
  }

  [part='header']:not(.hasHeader),
  [part='footer']:not(.hasFooter) {
    display: none;
  }
`;
