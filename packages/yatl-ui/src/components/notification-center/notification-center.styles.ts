import { css } from 'lit';

export default css`
  :host {
    --badge-bg: var(
      --yatl-notification-center-badge-bg,
      var(--yatl-color-danger)
    );
    --badge-color: var(--yatl-notification-center-badge-color, white);
    --panel-width: var(--yatl-notification-center-panel-width, 340px);
    --item-unread-bg: var(
      --yatl-notification-center-item-unread-bg,
      var(--yatl-surface-raised-1)
    );

    display: inline-flex;
  }

  yatl-dropdown {
    height: auto;
  }

  [part='trigger-wrapper'] {
    /* yatl-button clips its own content (overflow: hidden), so the badge
       is positioned relative to this wrapper instead of the button itself -
       otherwise the part that overhangs the button's edge gets clipped. */
    position: relative;
    display: inline-flex;
  }

  [part='badge'] {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(35%, -35%);
    min-width: 1.4em;
    height: 1.4em;
    padding: 0 0.3em;
    border-radius: 999px;
    background: var(--badge-bg);
    color: var(--badge-color);
    font-size: 0.7rem;
    line-height: 1.4em;
    text-align: center;
    pointer-events: none;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  [part='panel'] {
    display: flex;
    flex-direction: column;
    width: var(--panel-width);
    max-width: calc(100vw - var(--yatl-spacing-l) * 2);
  }

  [part='header'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--yatl-spacing-s);
    padding-bottom: var(--yatl-spacing-s);
    border-bottom: 1px solid var(--yatl-border-color);
  }

  [part='title'] {
    font-weight: 600;
  }

  [part='list'] {
    display: flex;
    flex-direction: column;
  }

  [part='empty'] {
    padding: var(--yatl-spacing-l) 0;
    color: var(--yatl-text-2);
    text-align: center;
  }

  [part='item'] {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--yatl-spacing-s);
    padding: var(--yatl-spacing-s) 0;
    border-bottom: 1px solid var(--yatl-border-color);
  }

  [part='list'] [part='item']:last-child {
    border-bottom: none;
  }

  [part='item'].unread {
    background: var(--item-unread-bg);
  }

  [part='item-icon'] {
    flex-shrink: 0;
    margin-top: 0.2em;
  }

  [part='item-icon'][data-variant='success'] {
    color: var(--yatl-color-success);
  }

  [part='item-icon'][data-variant='warning'] {
    color: var(--yatl-color-warning);
  }

  [part='item-icon'][data-variant='danger'] {
    color: var(--yatl-color-danger);
  }

  [part='item-body'] {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;
  }

  [part='item-label'] {
    font-weight: 600;
    overflow-wrap: break-word;
  }

  [part='item-message'] {
    color: var(--yatl-text-2);
    overflow-wrap: break-word;
  }

  [part='item-time'] {
    color: var(--yatl-text-3);
    font-size: 0.8rem;
  }

  [part='item-remove'] {
    flex-shrink: 0;
  }
`;
