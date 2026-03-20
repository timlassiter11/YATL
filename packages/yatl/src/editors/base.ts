import { YatlTableController } from '../table-controller/table-controller';
import { CellEditor, NestedKeyOf, UnspecifiedRecord } from '../types';

export interface BaseEditorOptions<T extends object = UnspecifiedRecord> {
  canEdit?: (field: NestedKeyOf<T>, row: T) => boolean;
}

export abstract class BaseEditor<T extends object = UnspecifiedRecord>
  implements CellEditor<T>
{
  constructor(protected readonly options?: BaseEditorOptions<T>) {}

  public canEdit(field: NestedKeyOf<T>, row: T) {
    return this.options?.canEdit?.(field, row) ?? true;
  }

  public abstract render(
    value: unknown,
    field: NestedKeyOf<T>,
    row: T,
    controller: YatlTableController<T>,
  ): unknown;
}
