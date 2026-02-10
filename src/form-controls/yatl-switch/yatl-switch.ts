import { customElement, property, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html } from 'lit';
import { live } from 'lit/directives/live.js';

import styles from './yatl-switch.styles';

@customElement('yatl-switch')
export class YatlSwitch extends YatlFormControl<string> {
  public static override styles = [...YatlFormControl.styles, styles];

  private _value = this.getAttribute('value') ?? 'on';
  private _uncheckedValue?: string;

  /**
   * The value to store in the form data if the checkbox is checked
   */
  @property({ type: String, reflect: true })
  public get value() {
    return this._value;
  }

  public set value(value) {
    if (this._value === value) {
      return;
    }

    const oldValue = this._value;
    this._value = value;
    this.updateFormValue();
    this.requestUpdate('value', oldValue);
  }

  public override get defaultValue() {
    return this.value;
  }

  
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

  @property({ type: Boolean, attribute: 'checked' })
  public defaultChecked = this.hasAttribute('checked');

  @property({ type: Boolean, attribute: 'always-include' })
  public alwaysInclude = false;

  public override inline = true;

  @state()
  private _checked = this.hasAttribute('checked');

  public get checked() {
    return this._checked;
  }

  public set checked(value) {
    this._checked = value;
    this.toggleState('checked', value);
    this.updateFormValue();
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

  constructor() {
    super();
    this.addEventListener('click', (event: Event) => this.handleClick(event));
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.checked = this.defaultChecked;
    this.updateFormValue();
  }

  protected override render() {
    return html`
      <div part="base">${this.renderInput()}</div>
      ${this.renderLabel()} ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`
      <input
        class="input"
        id=${this.inputId}
        name=${this.name}
        type="checkbox"
        value=${this.value}
        .checked=${live(this.checked)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        role="switch"
      />
      <span part="control" class="switch">
        <span part="thumb" class="thumb"></span>
      </span>
    `;
  }

  private updateFormValue() {
    this.setFormValue(this.formValue);
  }

  protected override onValueChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
  }

  private handleClick = (event: Event) => {
    const path = event.composedPath();
    if (!this.formControl || path.includes(this.formControl)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.formControl.click();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-switch': YatlSwitch;
  }
}
