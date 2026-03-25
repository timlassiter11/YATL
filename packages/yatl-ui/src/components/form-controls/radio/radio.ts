import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { YatlFormControl } from '../form-control/form-control';
import styles from './radio.styles';

@customElement('yatl-radio')
export class YatlRadio extends YatlFormControl<string> {
  public static override styles = [...super.styles, styles];

  // This control needs to be inline
  public override inline = true;

  private _value = this.getAttribute('value') ?? 'on';
  private _checked = this.hasAttribute('checked');

  /**
   * The value to store in the form data when the radio is selected.
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

  public get checked() {
    return this._checked;
  }

  @property({ type: Boolean, attribute: false })
  public set checked(value) {
    this._checked = Boolean(value);
    this.toggleState('checked', value);
    this.updateFormValue();
  }

  @property({ type: Boolean, attribute: 'checked' })
  public defaultChecked = this.hasAttribute('checked');

  public get formValue() {
    if (this._checked) {
      return this.value || 'on';
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
        type="radio"
        value=${this.value}
        .checked=${live(this.checked)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        @change=${this.handleChange}
      />
      <svg viewBox="0 0 16 16" part="radio">
        <circle cx="8" cy="8" r="8" />
      </svg>
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
    'yatl-radio': YatlRadio;
  }
}
