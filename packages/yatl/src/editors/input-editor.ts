import { html } from 'lit';
import { ColumnEditor, NestedKeyOf, UnspecifiedRecord } from '../types';
import { live } from 'lit/directives/live.js';
import { ifDefined } from 'lit/directives/if-defined.js';

export class InputEditor<T extends object = UnspecifiedRecord>
  implements ColumnEditor<T>
{
  private currentValue?: unknown;

  constructor(private readonly options?: InputEditorOptions) {}

  public render(value: unknown, _row: T) {
    return html`
      <input
        .value=${live(String(value))}
        type=${ifDefined(this.options?.type)}
        minlength=${ifDefined(this.options?.minlength)}
        maxlength=${ifDefined(this.options?.maxlength)}
        min=${ifDefined(this.options?.min)}
        max=${ifDefined(this.options?.max)}
        step=${ifDefined(this.options?.step)}
        pattern=${ifDefined(this.options?.pattern)}
        placeholder=${ifDefined(this.options?.placeholder)}
        autofocus
        @input=${this.handleChange}
      />
    `;
  }

  public save(originalValue: unknown, _field: NestedKeyOf<T>, _row: T) {
    if (
      this.currentValue === undefined ||
      this.currentValue === originalValue
    ) {
      return;
    }
    return this.currentValue;
  }

  private handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    switch (this.options?.type) {
      case 'checkbox':
        this.currentValue = target.checked;
        break;
      case 'date':
      case 'datetime-local':
        this.currentValue = target.valueAsDate;
        break;
      case 'number':
        this.currentValue = target.valueAsNumber;
        if (isNaN(this.currentValue as number)) {
          this.currentValue = null;
        }
        break;
      default:
        this.currentValue = target.value;
    }
  };
}

export type InputType =
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'month'
  | 'number'
  | 'range'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week';

export interface InputEditorOptions {
  type?: InputType;
  minlength?: number;
  maxlength?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  placeholder?: string;
}
