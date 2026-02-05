import { customElement, property, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html } from 'lit';
import { live } from 'lit/directives/live.js';

import styles from './yatl-checkbox.styles';

@customElement('yatl-checkbox')
export class YatlCheckbox extends YatlFormControl<boolean> {
  public static override styles = [...YatlFormControl.styles, styles];

  @property({ type: Boolean, attribute: 'checked' })
  public defaultChecked = false;

  private _uncheckedValue?: string;
  @property({ type: String, attribute: 'unchecked-value' })
  public get uncheckedValue() {
    return this._uncheckedValue;
  }

  public set uncheckedValue(value) {
    const oldValue = this.uncheckedValue;
    this._uncheckedValue = value;
    this.updateFormValue();
    this.requestUpdate('uncheckedValue', oldValue);
  }

  @property({ type: Boolean, attribute: 'always-include' })
  public alwaysInclude = false;

  public override inline = true;

  @state()
  private _checked = false;

  public get checked() {
    return this._checked;
  }

  public set checked(value) {
    this._checked = value;
    this.updateFormValue();
    this.requestUpdate();
  }

  public override formResetCallback() {
    this.checked = this.defaultChecked;
  }

  public override get typedValue() {
    return this.checked;
  }

  public override set typedValue(value) {
    this.checked = !!value;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this._checked = this.defaultChecked;
    this.updateFormValue();
  }

  protected override renderInput(id: string) {
    return html`
      <input
        part="input"
        id=${id}
        name=${this.name}
        type="checkbox"
        value=${this.value}
        .checked=${live(this.checked)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        @change=${this.handleCheckChange}
      />
    `;
  }

  private updateFormValue() {
    let formValue: string | null = null;
    if (this._checked) {
      formValue = this.value || 'on';
    } else if (this.alwaysInclude) {
      formValue = this.uncheckedValue ?? 'off';
    }

    this.setFormValue(formValue);
  }

  private handleCheckChange(event: Event) {
    event.stopImmediatePropagation();
    this.checked = this.formControl!.checked;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-checkbox': YatlCheckbox;
  }
}
