import { html } from 'lit';
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

  constructor() {
    super();
    // Set our initial checked state
    this.toggleState('checked', this.defaultChecked);
    this.addEventListener('click', this.handleClick);
  }

  public override connectedCallback() {
    super.connectedCallback();
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
        part="input"
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
    'yatl-checkbox': YatlCheckbox;
  }
}
