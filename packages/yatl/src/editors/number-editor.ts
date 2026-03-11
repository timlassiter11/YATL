import { UnspecifiedRecord } from '../types';
import { InputEditor } from './input-editor';

export interface NumberEditorOptions {
  min?: number;
  max?: number;
  step?: number;
}

export class NumberEditor<
  T extends object = UnspecifiedRecord,
> extends InputEditor<T> {
  constructor(options?: NumberEditorOptions) {
    super({
      type: 'number',
      ...options,
    });
  }
}
