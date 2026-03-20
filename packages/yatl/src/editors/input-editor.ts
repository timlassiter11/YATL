import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
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
    field: NestedKeyOf<T>,
    row: T,
    controller: YatlTableController<T>,
  ) {
    const save = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const { type, max, min } = this.options ?? {};

      let newValue;
      if (type === 'checkbox') {
        newValue = target.checked;
      } else if (type === 'date' || type === 'datetime-local') {
        newValue = target.valueAsDate;
      } else if (type === 'number') {
        newValue = target.valueAsNumber;
        if (isNaN(newValue)) {
          newValue = null;
        } else {
          if (typeof max === 'number' && newValue > max) {
            target.valueAsNumber = max;
            newValue = max;
          } else if (typeof min === 'number' && newValue < min) {
            target.valueAsNumber = min;
            newValue = min;
          }
        }
      } else {
        newValue = target.value;
      }

      if (newValue !== undefined) {
        controller.setPendingValue(row, field, newValue);
      }
    };

    return html`
      <input
        value=${String(value ?? '')}
        type=${ifDefined(this.options?.type)}
        minlength=${ifDefined(this.options?.minlength)}
        maxlength=${ifDefined(this.options?.maxlength)}
        min=${ifDefined(this.options?.min)}
        max=${ifDefined(this.options?.max)}
        step=${ifDefined(this.options?.step)}
        pattern=${ifDefined(this.options?.pattern)}
        placeholder=${ifDefined(this.options?.placeholder)}
        autofocus
        @input=${save}
      />
    `;
  }
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
