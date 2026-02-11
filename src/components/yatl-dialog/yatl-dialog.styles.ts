import { css } from 'lit';

export default css`
  :host {
    --dialog-bg: var(--yatl-dialog-bg, var(--yatl-surface-3));
    --dialog-text: var(--yatl-dialog-text, var(--yatl-text-1));
    --dialog-radius: var(--yatl-dialog-radius, var(--yatl-radius-l));
    --dialog-border-width: var(--yatl-dialog-border-width, 1px);
    --dialog-border-style: var(--yatl-dialog-border-style, solid);
    --dialog-border-color: var(
      --yatl-dialog-border-color,
      var(--yatl-border-color)
    );
    --dialog-width: var(--yatl-dialog-width, 500px);
    --dialog-padding: var(--yatl-dialog-padding, var(--yatl-spacing-s));
    --dialog-header-font-size: var(--yatl-dialog-header-font-size, medium);
    --dialog-header-font-weight: var(--yatl-dialog-header-font-weight, 700);
    --dialog-header-padding: var(
      --yatl-dialog-header-padding,
      var(--yatl-spacing-m)
    );
    --dialog-body-padding: var(
      --yatl-dialog-body-padding,
      var(--yatl-spacing-l)
    );
  }

  dialog {
    border: none;
    background: none;

    /* Animations */
    opacity: 0;
    transform: scale(0.95) translateY(10px);
    transition:
      opacity 0.3s cubic-bezier(0.2, 0.9, 0.3, 1),
      transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1),
      overlay 0.3s allow-discrete,
      display 0.3s allow-discrete;
  }

  dialog[open] {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  dialog:focus-visible {
    outline: none;
  }

  yatl-card {
    --card-bg: var(--dialog-bg);
    --card-text: var(--dialog-text);
    --card-border-radius: var(--dialog-radius);
    --card-border-width: var(--dialog-border-width);
    --card-border-style: var(--dialog-border-style);
    --card-border-color: var(--dialog-border-color);
    --card-header-font-size: var(--dialog-header-font-size);
    --card-header-font-weight: var(--dialog-header-font-weight);
    --card-header-padding: var(--dialog-header-padding);

    padding: var(--dialog-padding);
  }

  [part='header'] {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  [part='label'] {
    margin: 0;
  }

  [part='header-actions'],
  [part='footer-actions'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: var(--yatl-spacing-s);
  }

  [part='body'] {
    padding: var(--dialog-body-padding);
  }

  @starting-style {
    dialog[open] {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
  }

  dialog::backdrop {
    transition:
      background-color 0.3s ease-out,
      overlay 0.3s allow-discrete,
      display 0.3s allow-discrete;
  }

  dialog[open]::backdrop {
    background-color: color-mix(in oklab, black 60%, transparent);
  }

  @starting-style {
    dialog[open]::backdrop {
      background-color: rgb(0 0 0 / 0%);
    }
  }
`;
