import { RowId } from '../types';

export class YatlError extends Error {
  constructor(message: string, solution?: string) {
    if (solution) {
      message += '\n' + solution;
    }
    super(`[yatl-table] ${message}`);
    this.name = 'YatlError';
  }
}

export function throwInvalidRowId(providedId: unknown): never {
  const isMissing = providedId === null || providedId === undefined;

  const message = isMissing
    ? `RowID cannot be null or undefined.`
    : `Expected a string or number for RowID, but received: ${String(
        providedId,
      )} (type: ${typeof providedId}).`;

  const solution = `Verify that you are passing the correct identifier and that your 'rowIdCallback' is returning a valid primitive.`;

  throw new YatlError(message, solution);
}

export function throwRowNotFound(rowId: RowId): never {
  throw new YatlError(
    `RowID "${String(rowId)}" does not exist in the current dataset.`,
    `Ensure the data has been loaded before calling this method, or check your RowID logic.`,
  );
}
