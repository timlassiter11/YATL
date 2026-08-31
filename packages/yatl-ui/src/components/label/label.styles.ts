import { css } from 'lit';

export default css`
  :host {
    --label-text: var(
      --yatl-label-text,
      var(--yatl-input-label-text, var(--yatl-text-1))
    );
    --label-font-size: var(
      --yatl-label-font-size,
      var(--yatl-input-label-font-size, large)
    );
    --label-font-weight: var(
      --yatl-label-font-weight,
      var(--yatl-input-label-font-weight, 700)
    );

    display: block;
    box-sizing: border-box;
  }

  .base {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--yatl-spacing-s);

    color: var(--label-text);
    font-size: var(--label-font-size);
    font-weight: var(--label-font-weight);
  }

  .clickable {
    cursor: pointer;
  }
`;
