import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { YatlTableController } from '../table-controller/table-controller';
import { NestedKeyOf, UnspecifiedRecord } from '../types';
import { BaseEditor, BaseEditorOptions } from './base';

export class InputEditor<
  T extends object = UnspecifiedRecord,
> extends BaseEditor<T> {
  constructor(public override readonly options?: InputEditorOptions<T>) {
    super(options);
  }

  public render(
    value: unknown,
    _field: NestedKeyOf<T>,
    _row: T,
    _controller: YatlTableController<T>,
  ) {
    return html`
      <input
        .value=${live(String(value ?? ''))}
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

  private handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const { type, max, min } = this.options ?? {};

    if (type === 'checkbox') {
      this.currentValue = target.checked;
    } else if (type === 'date' || type === 'datetime-local') {
      this.currentValue = target.valueAsDate;
    } else if (type === 'number') {
      let value: number | null = target.valueAsNumber;
      if (isNaN(value)) {
        value = null;
      } else {
        if (typeof max === 'number' && value > max) {
          target.valueAsNumber = max;
          value = max;
        } else if (typeof min === 'number' && value < min) {
          target.valueAsNumber = min;
          value = min;
        }
        this.currentValue = value;
      }
    } else {
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

export interface InputEditorOptions<T extends object = UnspecifiedRecord>
  extends BaseEditorOptions<T> {
  type?: InputType;
  minlength?: number;
  maxlength?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  placeholder?: string;
}
