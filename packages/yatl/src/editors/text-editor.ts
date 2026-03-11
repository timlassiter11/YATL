import { UnspecifiedRecord } from '../types';
import { InputEditor } from './input-editor';

export interface TextEditorOptions {
  minlength?: number;
  maxlength?: number;
  pattern?: string;
  placeholder?: string;
}

export class TextEditor<
  T extends object = UnspecifiedRecord,
> extends InputEditor<T> {
  constructor(options?: TextEditorOptions) {
    super({
      type: 'text',
      ...options,
    });
  }
}
