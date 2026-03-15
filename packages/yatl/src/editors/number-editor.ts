import { UnspecifiedRecord } from '../types';
import { BaseEditorOptions } from './base';
import { InputEditor } from './input-editor';

export interface NumberEditorOptions<T extends object = UnspecifiedRecord>
  extends BaseEditorOptions<T> {
  min?: number;
  max?: number;
  step?: number;
}

export class NumberEditor<
  T extends object = UnspecifiedRecord,
> extends InputEditor<T> {
  constructor(options?: NumberEditorOptions<T>) {
    super({
      type: 'number',
      ...options,
    });
  }
}
