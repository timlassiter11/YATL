import { css } from 'lit';

export default css`
  :host {
    --option-color: var(--yatl-option-color, var(--yatl-text-1));
    --option-font-size: var(--yatl-option-font-size, 16px);
    --option-bg: var(--yatl-option-bg, transparent);
    --option-hover-bg: var(--yatl-option-hover-bg, var(--yatl-color-brand));
    --option-padding: var(
      --yatl-option-padding,
      var(--yatl-spacing-s) var(--yatl-spacing-m)
    );
    --option-gap: var(--yatl-option-gap, var(--yatl-spacing-xs));
    --option-radius: var(--yatl-option-radius, var(--yatl-radius-s));
    --option-focus-ring: var(
      --yatl-option-focus-ring,
      3px solid var(--yatl-color-brand)
    );
    --option-focus-bg: var(
      --yatl-option-focus-bg,
      color-mix(in srgb, var(--yatl-mix-color), 5%, transparent)
    );
    --option-disabled-color: var(
      --yatl-option-disabled-color,
      var(--yatl-text-3)
    );
    border-radius: var(--option-radius);
  }

  :host(:focus-visible) {
    z-index: 1;
    outline: var(--option-focus-ring);
    background-color: var(--option-focus-bg);
  }

  [part='base'] {
    display: flex;
    align-items: center;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;

    color: var(--option-color);
    font-size: var(--option-font-size);
    background-color: var(--option-bg);
    padding: var(--option-padding);
    border-radius: var(--option-radius);
    transition: background 0.1s ease;
  }

  :host([disabled]) [part='base'] {
    color: var(--option-disabled-color);
    cursor: not-allowed;
  }

  :host(:not([disabled])) [part='base']:hover {
    background-color: var(--option-hover-bg);
  }

  [part='label'] {
    flex-grow: 1;
  }

  [part='start'],
  [part='end'] {
    flex-shrink: 0;
  }

  [part='check'] {
    width: 18px;
    height: 18px;
    margin-right: var(--yatl-spacing-s);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 3px;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46);
  }

  :host([checked]) [part='check'] {
    opacity: 1;
    transform: scale(1);
  }
`;
