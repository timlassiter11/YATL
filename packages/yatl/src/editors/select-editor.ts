import { html } from 'lit';
import { ColumnEditor, NestedKeyOf, UnspecifiedRecord } from '../types';
import { live } from 'lit/directives/live.js';
import { YatlTableController } from '../table-controller/table-controller';
import { repeat } from 'lit/directives/repeat.js';

export class SelectEditor<T extends object = UnspecifiedRecord>
  implements ColumnEditor<T>
{
  private currentValue?: unknown;

  constructor(private readonly options?: SelectEditorOptions) {}

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

  public save(
    originalValue: unknown,
    _field: NestedKeyOf<T>,
    _row: T,
    _controller: YatlTableController<T>,
  ) {
    if (
      this.currentValue === undefined ||
      this.currentValue === originalValue
    ) {
      return;
    }

    const newValue = this.currentValue;
    this.currentValue = undefined;
    return newValue;
  }

  private handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.currentValue = target.value;
  };
}

export interface SelectEditorOptions {
  labelRenderer?: (value: unknown) => [string, string];
}
