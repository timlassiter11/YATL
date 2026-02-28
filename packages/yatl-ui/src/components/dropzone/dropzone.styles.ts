import { css } from 'lit';

export default css`
  :host {
    --dropzone-z-index: var(--yatl-dropzone-z-index, 1);
    --dropzone-inset: var(--yatl-dropzone-inset, 5px);
    --dropzone-radius: var(--yatl-dropzone-radius, var(--yatl-radius-s));
    --dropzone-outline-width: var(--yatl-dropzone-outline-width, 2px);
    --dropzone-outline-style: var(--yatl-dropzone-outline-style, solid);
    --dropzone-outline-offset: var(--yatl-dropzone-outline-offset, -2px);
    --dropzone-bg-transition-duration: var(
      --yatl-dropzone-bg-transition-duration,
      0.25s
    );

    /* State styles */
    /* No style for hint or invalid drops by default but allow the user to set them */

    /* Hint: Shown while the user is dragging anywhere within the window */
    --dropzone-hint-bg: var(--yatl-dropzone-hint-bg, transparent);
    --dropzone-hint-outline-color: var(
      --yatl-dropzone-hint-outline-color,
      transparent
    );

    /* Invalid: Shown when drag over a dropzone and the drop request is rejected */
    --dropzone-invalid-bg: var(--yatl-dropzone-invalid-bg, transparent);
    --dropzone-invalid-outline-color: var(
      --yatl-dropzone-invalid-outline-color,
      transparent
    );

    /* Valid: Shown when drag over a dropzone and the drop request isn't rejected */
    --dropzone-valid-bg: var(
      --yatl-dropzone-valid-bg,
      color-mix(in oklab, var(--yatl-color-brand) 20%, transparent)
    );
    --dropzone-valid-outline-color: var(
      --yatl-dropzone-valid-outline-color,
      var(--yatl-color-brand)
    );

    display: flex;
    pointer-events: none;
    position: absolute;
    inset: var(--dropzone-inset);
    z-index: var(--dropzone-z-index);

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
    pointer-events: none;
  }

  slot[name] {
    display: none;
  }

  :host([show-hint]) {
    /* Only recieve events if the user is actively dragging something */
    pointer-events: all;
    background-color: var(--dropzone-hint-bg);
    outline-color: var(--dropzone-hint-outline-color);

    .has-hint {
      slot:not([name]) {
        display: none;
      }
      slot[name='hint'] {
        display: contents;
      }
    }
  }

  :host([state='valid']) {
    background-color: var(--dropzone-valid-bg);
    outline-color: var(--dropzone-valid-outline-color);

    .has-valid {
      slot:not([name]),
      slot[name='hint'] {
        display: none;
      }
      slot[name='valid'] {
        display: contents;
      }
    }
  }

  :host([state='invalid']) {
    background-color: var(--dropzone-invalid-bg);
    outline-color: var(--dropzone-invalid-outline-color);

    .has-invalid {
      slot:not([name]),
      slot[name='hint'] {
        display: none;
      }
      slot[name='invalid'] {
        display: contents;
      }
    }
  }
`;
