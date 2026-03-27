import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { YatlFormControl } from '../form-control/form-control';

import styles from './checkbox.styles';

@customElement('yatl-checkbox')
export class YatlCheckbox extends YatlFormControl<string> {
  public static override styles = [...super.styles, styles];

  // This control needs to be inline
  public override inline = true;

  private _value = this.getAttribute('value') ?? 'on';
  private _checked = this.hasAttribute('checked');
  private _uncheckedValue?: string;

  /**
   * The value to store in the form data when the checkbox is checked.
   */
  public get value() {
    return this._value;
  }

  @property({ type: String, reflect: true })
  public set value(value) {
    this._value = value;
    this.updateFormValue();
  }

  public override get defaultValue() {
    return this.value;
  }

  /**
   * The value to store in the form data when the checkbox is *not* checked.
   * *NOTE*: Only used when 'always-include' is set.
   * @attr unchecked-value
   */
  public get uncheckedValue() {
    return this._uncheckedValue;
  }

  @property({ type: String, attribute: 'unchecked-value' })
  public set uncheckedValue(value) {
    this._uncheckedValue = value;
    this.updateFormValue();
  }

  /**
   * If set, the `unchecked-value` will be submitted when the checkbox is *not* checked.
   * @attr always-include
   */
  @property({ type: Boolean, attribute: 'always-include' })
  public alwaysInclude = false;

  /**
   * The current check state of the checkbox.
   */
  public get checked() {
    return this._checked;
  }

  @property({ type: Boolean, attribute: false })
  public set checked(value) {
    this._checked = Boolean(value);
    this.toggleState('checked', value);
    this.updateFormValue();
  }

  @property({ type: Boolean, reflect: true, attribute: 'checked' })
  public defaultChecked = this.hasAttribute('checked');

  public get formValue() {
    if (this._checked) {
      return this.value || 'on';
    } else if (this.alwaysInclude) {
      return this.uncheckedValue ?? 'off';
    }
    return null;
  }

  protected override onFormReset() {
    this.checked = this.defaultChecked;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.updateFormValue();
  }

  protected override firstUpdated(changedProps: PropertyValues<YatlCheckbox>) {
    super.firstUpdated(changedProps);
    this._checked = this.defaultChecked;
    this.toggleState('checked', this._checked);
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base" class="base">${this.renderInput()}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`
      <input
        part="input"
        class="input"
        id=${this.inputId}
        name=${this.name}
        type="checkbox"
        value=${this.value}
        .checked=${live(this.checked)}
        ?disabled=${this.disabled || this.readonly}
        ?required=${this.required}
        @change=${this.handleChange}
      />
    `;
  }

  private updateFormValue() {
    this.setFormValue(this.formValue);
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    this.checked = (event.target as HTMLInputElement).checked;
    this.emitInteraction('change');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-checkbox': YatlCheckbox;
  }
}
