import { css } from 'lit';

export default css`
  :host {
    /* The color prop sets these and the variant prop decides how to use it */
    --appearance-text: currentColor;
    --appearance-color: var(--yatl-color-neutral);
  }

  :host([color='brand']) {
    --appearance-color: var(--yatl-color-brand);
    --appearance-text: var(--yatl-text-brand);
  }

  :host([color='danger']) {
    --appearance-color: var(--yatl-color-danger);
    --appearance-text: var(--yatl-text-1-light);
  }

  :host([color='warning']) {
    --appearance-color: var(--yatl-color-warning);
    --appearance-text: white;
  }

  :host([color='success']) {
    --appearance-color: var(--yatl-color-success);
    --appearance-text: white;
  }

  :host([color='raised']) {
    --appearance-color: var(--yatl-surface-raised-1);
    --appearance-text: var(--yatl-text-1);
  }

  :host([color='muted']) {
    --appearance-color: var(--yatl-text-3);
    --appearance-text: white;
  }
`;
