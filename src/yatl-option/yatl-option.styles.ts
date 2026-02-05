import { css } from 'lit';

export default css`
  :host {
    --dropdown-item-text: var(--yatl-dropdown-item-text, var(--yatl-text-1));
    --dropdown-item-font-size: var(--yatl-dropdown-item-font-size, 16px);
    --dropdown-item-bg: var(--yatl-dropdown-item-bg, transparent);
    --dropdown-item-hover-bg: var(
      --yatl-dropdown-item-hover-bg,
      var(--yatl-color-brand)
    );
    --dropdown-item-padding: var(
      --yatl-dropdown-item-padding,
      var(--yatl-spacing-s) var(--yatl-spacing-m)
    );
    --dropdown-item-gap: var(--yatl-dropdown-item-gap, var(--yatl-spacing-xs));
    --dropdown-item-radius: var(
      --yatl-dropdown-item-radius,
      var(--yatl-radius-s)
    );
    --dropdown-item-focus-ring: var(
      --yatl-dropdown-item-focus-ring,
      3px solid var(--yatl-color-brand)
    );
    --dropdown-item-focus-bg: var(
      --yatl-dropdown-item-focus-bg,
      color-mix(in srgb, var(--yatl-mix-color), 5%, transparent)
    );

    border-radius: var(--dropdown-item-radius);
  }

  :host(:focus-visible) {
    z-index: 1;
    outline: var(--dropdown-item-focus-ring);
    background-color: var(--dropdown-item-focus-bg);
  }

  [part='base'] {
    display: flex;
    align-items: center;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;

    color: var(--dropdown-item-text);
    font-size: var(--dropdown-item-font-size);
    background-color: var(--dropdown-item-bg);
    gap: var(--dropdown-item-gap);
    padding: var(--dropdown-item-padding);
    border-radius: var(--dropdown-item-radius);
    transition: background 0.1s ease;
  }

  [part='base']:hover {
    background-color: var(--dropdown-item-hover-bg);
  }

  [part='input'] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  [part='check'] {
    width: 18px;
    height: 18px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  [part='check'] {
    width: 14px;
    height: 14px;
    fill: var(--dropdown-item-text);
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46);
  }

  :host([checked]) [part='check'] {
    opacity: 1;
    transform: scale(1);
  }

  [part='label'] {
    font-size: 14px;
    color: var(--dropdown-item-text);
  }
`;
