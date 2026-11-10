import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBaseFilter } from '../base-filter/base-filter';
import styles from './typeahead-filter.styles';
import { YatlTypeahead } from '../../form-controls/typeahead/typeahead';

@customElement('yatl-typeahead-filter')
export class YatlTypeaheadFilter extends YatlBaseFilter<string> {
  // Redeclared with this filter's type, so template type checkers
  // (like lit-analyzer) don't see the base class's generic TValue.
  // It only passes through to YatlBaseFilter's value.
  /**
   * The picked value.
   * @attr value - The initial value.
   */
  public override get value(): string | undefined {
    return super.value;
  }
  public override set value(value: string | undefined) {
    super.value = value;
  }

  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public placeholder = '';

  /**
   * Maximum number of options to display in the dropdown at one time.
   * @attr max-options
   * @default 20
   */
  @property({ type: Number, attribute: 'max-options' })
  public maxOptions = 20;

  /**
   * Minimum number of characters required before firing a remote network request.
   * Note: Local searches trigger instantly regardless of this value.
   * @attr min-query-length
   * @default 3
   */
  @property({ type: Number, attribute: 'min-query-length' })
  public minQueryLength = 3;

  protected override render() {
    return html`
      <yatl-typeahead
        name=${this.field}
        label=${this.label}
        placeholder=${this.placeholder}
        max-options=${this.maxOptions}
        min-query-length=${this.minQueryLength}
        ?disabled=${this.disabled}
        .value=${this.value ?? ''}
        .localData=${this.options}
        @change=${this.handleChange}
      ></yatl-typeahead>
    `;
  }

  private handleChange(event: Event) {
    const target = event.target as YatlTypeahead;
    this.value = target.value || undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-typeahead-filter': YatlTypeaheadFilter;
  }
}
