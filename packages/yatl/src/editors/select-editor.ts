import { html, TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { YatlTableController } from '../table-controller/table-controller';
import { FilterOption, NestedKeyOf, UnspecifiedRecord } from '../types';
import { BaseEditor, BaseEditorOptions } from './base';
import { isTemplateResult } from 'lit/directive-helpers.js';

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
    const save = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      controller.setPendingValue(row, field, target.value);
    };

    return html`
      <select value=${String(value)} @change=${save}>
        ${this.renderOptions(value, field, controller)}
      </select>
    `;
  }

  protected renderOptions(
    value: unknown,
    field: NestedKeyOf<T>,
    controller: YatlTableController<T>,
  ) {
    if (isTemplateResult(this.options?.options)) {
      return this.options?.options;
    }

    const values = controller.getColumnFilterValues(field, false);
    return repeat(
      values,
      option => option.value,
      option => this.renderOption(option, option.value === value),
    );
  }

  protected renderOption(option: FilterOption, select: boolean) {
    const value = String(option.value);
    const label = this.options?.labelRenderer?.(option) ?? option.label;
    return html` <option value=${value} ?selected=${select}>${label}</option> `;
  }
}

export interface SelectEditorOptions<T extends object = UnspecifiedRecord>
  extends BaseEditorOptions<T> {
  options?: [string, string][] | TemplateResult;
  labelRenderer?: (option: FilterOption) => string;
}
