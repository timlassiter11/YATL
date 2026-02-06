import { customElement, property, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html, TemplateResult } from 'lit';
import { live } from 'lit/directives/live.js';

import styles from './yatl-checkbox.styles';

@customElement('yatl-checkbox')
export class YatlCheckbox extends YatlFormControl<string> {
  public static override styles = [...YatlFormControl.styles, styles];

  /**
   * The value to store in the form data if the checkbox is checked
   */
  @property({ type: String })
  public value = 'on';

  public get defaultValue() {
    // Just use the value attribute since it doesn't really change on checkboxes
    return this.value;
  }

  private _uncheckedValue?: string;
  @property({ type: String, attribute: 'unchecked-value' })
  public get uncheckedValue() {
    return this._uncheckedValue;
  }

  public set uncheckedValue(value) {
    const oldValue = this.uncheckedValue;
    this._uncheckedValue = value;
    this.updateValue();
    this.requestUpdate('uncheckedValue', oldValue);
  }

  @property({ type: Boolean, attribute: 'checked' })
  public defaultChecked = false;

  

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
    this.updateValue();
  }

  public get formValue() {
    if (this._checked) {
      return this.value || 'on';
    } else if (this.alwaysInclude) {
      return this.uncheckedValue ?? 'off';
    }
    return null;
  }

  public override formResetCallback() {
    this.checked = this.defaultChecked;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.checked = this.defaultChecked;
    this.updateValue();
  }

  protected override render() {
    const inputId = 'input';
    return html`
      <div part="base">${this.renderInput(inputId)}</div>
      ${this.renderLabel(inputId)} ${this.renderHint()}
      ${this.renderErrorText()}
    `;
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
      />
    `;
  }

  private updateValue() {
    this.setFormValue(this.formValue);
  }

  protected override onValueChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-checkbox': YatlCheckbox;
  }
}
