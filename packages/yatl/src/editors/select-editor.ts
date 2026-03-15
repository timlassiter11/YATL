import { html } from 'lit';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlTableController } from '../table-controller/table-controller';
import { NestedKeyOf, UnspecifiedRecord } from '../types';
import { BaseEditor, BaseEditorOptions } from './base';

export class SelectEditor<
  T extends object = UnspecifiedRecord,
> extends BaseEditor<T> {
  constructor(protected override readonly options?: SelectEditorOptions<T>) {
    super(options);
  }

  public render(
    value: unknown,
    field: NestedKeyOf<T>,
    row: T,
    controller: YatlTableController<T>,
  ) {
    const values = controller.getColumnFilterValues(field, false);
    return html`
      <select .value=${live(String(value))} @change=${this.handleChange}>
        ${repeat(
          values.keys(),
          option => option,
          option => this.renderOption(option, option === value),
        )}
      </select>
    `;
  }

  public renderOption(option: unknown, select: boolean) {
    const [value, display] = this.options?.labelRenderer?.(option) ?? [
      String(option),
      String(option),
    ];
    return html`
      <option value=${value} ?selected=${select}>${display}</option>
    `;
  }

  private handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.currentValue = target.value;
  };
}

export interface SelectEditorOptions<T extends object = UnspecifiedRecord>
  extends BaseEditorOptions<T> {
  labelRenderer?: (value: unknown) => [string, string];
}
