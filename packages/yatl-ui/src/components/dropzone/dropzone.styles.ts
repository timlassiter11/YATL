import { css } from 'lit';

export default css`
  :host {
    --dropzone-inset: var(--yatl-dropzone-inset, 5px);
    --dropzone-radius: var(--yatl-dropzone-radius, var(--yatl-radius-s));
    --dropzone-outline-width: var(--yatl-dropzone-outline-width, 2px);
    --dropzone-outline-style: var(--yatl-dropzone-outline-style, solid);
    --dropzone-outline-offset: var(--yatl-dropzone-outline-offset, -2px);

    --dropzone-hint-outline-color: var(
      --yatl-dropzone-hint-outline-color,
      transparent
    );
    --dropzone-valid-outline-color: var(
      --yatl-dropzone-valid-outline-color,
      var(--yatl-color-brand)
    );
    --dropzone-invalid-outline-color: var(
      --yatl-dropzone-invalid-outline-color,
      var(--yatl-color-danger)
    );

    --dropzone-hint-bg: var(--yatl-dropzone-hint-bg, transparent);
    --dropzone-valid-bg: var(
      --yatl-dropzone-valid-bg,
      color-mix(in oklab, var(--yatl-color-brand) 20%, transparent)
    );
    --dropzone-invalid-bg: var(
      --yatl-dropzone-invalid-bg,
      color-mix(in oklab, var(--yatl-color-danger) 10%, transparent)
    );
    --dropzone-bg-transition-duration: var(
      --yatl-dropzone-bg-transition-duration,
      0.25s
    );
    --dropzone-z-index: var(--yatl-dropzone-z-index, 1);

    position: absolute;
    inset: var(--dropzone-inset);
    z-index: var(--dropzone-z-index);
    pointer-events: none;

    display: flex;
    transition: background-color var(--dropzone-bg-transition-duration) ease,
      outline var(--dropzone-bg-transition-duration) ease;

    border-radius: var(--dropzone-radius);
    outline-color: transparent;
    outline-width: var(--dropzone-outline-width);
    outline-style: var(--dropzone-outline-style);
    outline-offset: var(--dropzone-outline-offset);
  }

  [part='contents'] {
    margin: auto;
  }

  :host([show-hint]) {
    background-color: var(--dropzone-hint-bg);
    outline-color: var(--dropzone-hint-outline-color);
  }

  :host([state='valid']) {
    background-color: var(--dropzone-valid-bg);
    outline-color: var(--dropzone-valid-outline-color);
  }

  :host([state='invalid']) {
    background-color: var(--dropzone-invalid-bg);
    outline-color: var(--dropzone-invalid-outline-color);
  }
`;
