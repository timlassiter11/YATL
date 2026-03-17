import { UnspecifiedRecord } from '../types';
import { BaseEditorOptions } from './base';
import { InputEditor } from './input-editor';

export interface DateEditorOptions<T extends object = UnspecifiedRecord>
  extends BaseEditorOptions<T> {
  min?: Date;
  max?: Date;
  step?: number;
}

export class DateEditor<
  T extends object = UnspecifiedRecord,
> extends InputEditor<T> {
  constructor(options?: DateEditorOptions<T>) {
    const { min, max, ...base } = options ?? {};
    super({
      ...base,
      type: 'date',
      min: min?.toISOString().split('T')[0],
      max: max?.toISOString().split('T')[0],
    });
  }
}
