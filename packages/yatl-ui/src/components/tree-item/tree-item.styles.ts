import { css } from 'lit';

export default css`
  :host {
    display: block;
  }

  summary {
    display: flex;
    flex-direction: row;
    gap: var(--yatl-spacing-xs);
    padding: var(--yatl-spacing-s);
    cursor: pointer;
  }

  summary > yatl-button {
    pointer-events: none;
    visibility: hidden;
    flex-shrink: 0;
  }

  details.has-children > summary > yatl-button {
    pointer-events: all;
    visibility: visible;
  }

  details::details-content {
    /* 
     * Align with center of arrow. 
     * Size of icon + size of padding for small button.
     */
    margin-left: calc(1em + var(--yatl-spacing-xs));
  }

  [part='arrow-icon'] {
    transform: rotate(-90deg);
    transition: transform var(--close-speed) var(--close-curve);
  }

  :host([open]) [part='arrow-icon'] {
    transform: rotate(0deg);
    transition: transform var(--open-speed) var(--open-curve);
  }

  [part='children'] {
    border-left: 1px solid var(--yatl-border-color);
  }

  :host([selected]) {
    summary {
      background-color: var(--yatl-surface-raised-1);
      border-left: 1px solid var(--yatl-color-brand);
    }
  }
`;
