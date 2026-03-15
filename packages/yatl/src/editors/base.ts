import { YatlTableController } from '../table-controller/table-controller';
import {
  ColumnEditor,
  MaybePromise,
  NestedKeyOf,
  UnspecifiedRecord,
} from '../types';

export interface BaseEditorOptions<T extends object = UnspecifiedRecord> {
  onSave?: (
    oldValue: unknown,
    newValue: unknown,
    field: NestedKeyOf<T>,
    row: T,
  ) => MaybePromise<unknown | undefined>;
}

export abstract class BaseEditor<T extends object = UnspecifiedRecord>
  implements ColumnEditor<T>
{
  protected currentValue: unknown;

  constructor(protected readonly options?: BaseEditorOptions<T>) {}

  public reset() {
    this.currentValue = undefined;
  }

  public abstract render(
    value: unknown,
    field: NestedKeyOf<T>,
    row: T,
    controller: YatlTableController<T>,
  ): unknown;

  public save(
    originalValue: unknown,
    field: NestedKeyOf<T>,
    row: T,
    _controller: YatlTableController<T>,
  ) {
    if (
      this.currentValue === undefined ||
      this.currentValue === originalValue
    ) {
      return;
    }

    if (!this.options?.onSave) {
      return this.currentValue;
    }

    return this.options.onSave(originalValue, this.currentValue, field, row);
  }
}
