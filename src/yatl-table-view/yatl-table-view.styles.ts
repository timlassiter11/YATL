import { css } from "lit";

export default css`
  main {
    width: 100%;
    height: 100%;
  }

  [part='view'] {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
  }

  [part='sidebar'] {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    margin-right: var(--yatl-spacing-m);
    min-width: 300px;
  }
`;