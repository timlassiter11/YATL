import { UnspecifiedRecord } from '../types';
import { BaseEditorOptions } from './base';
import { InputEditor } from './input-editor';

export interface TextEditorOptions<T extends object = UnspecifiedRecord>
  extends BaseEditorOptions<T> {
  minlength?: number;
  maxlength?: number;
  pattern?: string;
  placeholder?: string;
}

export class TextEditor<
  T extends object = UnspecifiedRecord,
> extends InputEditor<T> {
  constructor(options?: TextEditorOptions<T>) {
    super({
      type: 'text',
      ...options,
    });
  }
}
