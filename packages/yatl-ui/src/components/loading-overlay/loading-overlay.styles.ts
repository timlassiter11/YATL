import { css } from 'lit';

export default css`
  :host {
    --overlay-bg: var(
      --yatl-loading-overlay-bg,
      color-mix(in srgb, black 50%, transparent)
    );
    --overlay-spinner-color: var(
      --yatl-loading-overlay-spinner-color,
      var(--yatl-color-brand)
    );
    --overlay-text: var(--yatl-loading-overlay-text, var(--yatl-text-1));
    --overlay-fade-duration: var(--yatl-loading-overlay-fade-duration, 0.3s);
    --overlay-z-index: 10;

    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: var(--overlay-bg);
    z-index: var(--overlay-z-index);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--overlay-fade-duration) ease,
      visibility var(--overlay-fade-duration) ease;
    pointer-events: none;
  }

  :host([show]) {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--yatl-spacing-m);
    color: var(--overlay-text);
  }

  [part='spinner'] {
    font-size: 5rem;
    color: var(--overlay-spinner-color);
  }

  [part='message'] {
    font-size: small;
    text-align: center;
  }
`;
