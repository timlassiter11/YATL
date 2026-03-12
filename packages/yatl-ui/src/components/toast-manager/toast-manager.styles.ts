import { css } from 'lit';

export default css`
  :host {
    --offset-x: var(--yatl-toast-manager-offset-x, 24px);
    --offset-y: var(--yatl-toast-manager-offset-y, 24px);
    --gap: var(--yatl-toast-manager-gap, var(--yatl-spacing-s));

    display: flex;
    flex-direction: column;
    gap: var(--gap);

    border: none;
    background: none;
    overflow: visible;
  }

  :host([position='top-left']) {
    margin-left: var(--offset-x);
    margin-right: auto;
    margin-top: var(--offset-y);
    margin-bottom: auto;
  }

  :host([position='top-center']) {
    margin-left: auto;
    margin-right: auto;
    margin-top: var(--offset-y);
    margin-bottom: auto;
  }

  :host([position='top-right']) {
    margin-left: auto;
    margin-right: var(--offset-x);
    margin-top: var(--offset-y);
    margin-bottom: auto;
  }

  :host([position='bottom-left']) {
    margin-left: var(--offset-x);
    margin-right: auto;
    margin-top: auto;
    margin-bottom: var(--offset-y);
  }

  :host([position='bottom-center']) {
    margin-left: auto;
    margin-right: auto;
    margin-top: auto;
    margin-bottom: var(--offset-y);
  }

  :host([position='bottom-right']) {
    margin-left: auto;
    margin-right: var(--offset-x);
    margin-top: auto;
    margin-bottom: var(--offset-y);
  }
`;
