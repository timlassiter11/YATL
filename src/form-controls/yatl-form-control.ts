import { html, LitElement, nothing, PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import theme from '../theme';
import styles from './yatl-form-control.styles';

export type FormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | YatlFormControl;

export abstract class YatlFormControl<
  TData = string,
  TInput extends FormControl = HTMLInputElement,
> extends LitElement {
  public static override styles = [theme, styles];
  public static formAssociated = true;
  public static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  protected readonly internals: ElementInternals;

  @query('input')
  protected formControl?: TInput;

  @property({ type: String })
  public name = '';

  @property({ type: String })
  public label = '';

  @property({ type: String })
  public hint = '';

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ type: Boolean, reflect: true })
  public readonly = false;

  @property({ type: Boolean, reflect: true })
  public required = false;

  @property({ type: Boolean, reflect: true })
  public inline = false;

  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  @state()
  private _value: string = '';

  public get value() {
    return this._value;
  }

  public set value(newValue) {
    const oldValue = this._value;
    if (newValue === oldValue) return;

    this._value = newValue;
    this.setFormValue(newValue);
    this.requestUpdate();
  }

  public abstract get typedValue(): TData | null;
  public abstract set typedValue(value);

  private _errorText = '';
  @property({ type: String, attribute: 'error-text' })
  public get errorText() {
    return this._errorText || this.validationMessage;
  }

  @property({ type: String, attribute: 'required-text' })
  public requiredText = 'This field is required';

  public set errorText(newValue) {
    const oldValue = this.errorText;
    if (newValue === oldValue) return;
    this._errorText = newValue;
    this.updateValidity();
    this.requestUpdate('errorText', oldValue);
  }

  public constructor() {
    super();
    this.internals = this.attachInternals();
  }

  protected override createRenderRoot() {
    const root = super.createRenderRoot();
    root.addEventListener('input', this.handleControlEvent);
    root.addEventListener('change', this.handleControlEvent);
    return root;
  }

  public connectedCallback() {
    super.connectedCallback();
    if (!this.value && this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlFormControl<TData, TInput>>,
  ): void {
    if (changedProperties.has('required')) {
      // Keep the underlying form control in sync before we update validity.
      // Our validity relies on the form control so if it is out of sync we get a false positive
      if (this.formControl && this.formControl.required !== this.required) {
        this.formControl.required = this.required;
      }
      this.updateValidity();
    }

    if (changedProperties.has('requiredText')) {
      this.updateValidity();
    }
  }

  protected override render() {
    const inputId = 'input';
    return html`
      ${this.renderLabel(inputId)}
      <div part="base">${this.renderInput(inputId)}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected renderLabel(inputId: string): unknown {
    if (!this.label) {
      return nothing;
    }

    return html`
      <label part="label" for=${inputId}>
        <slot name="label">
          <span>${this.label}</span>
        </slot>
      </label>
    `;
  }

  protected renderHint(): unknown {
    if (!this.hint || this.hasErrorText) {
      return nothing;
    }

    return html`
      <slot name="hint">
        <span part="hint">${this.hint}</span>
      </slot>
    `;
  }

  protected renderErrorText(): unknown {
    if (!this.hasErrorText) {
      return nothing;
    }

    return html`
      <slot name="error">
        <span part="error">${this.errorText}</span>
      </slot>
    `;
  }

  protected abstract renderInput(id: string): unknown;

  protected get hasErrorText() {
    return this.errorText;
  }

  public get validity() {
    return this.internals.validity;
  }

  public get validationMessage() {
    return this.internals.validationMessage;
  }

  public get willValidate() {
    return this.internals.willValidate;
  }

  public checkValidity() {
    this.updateValidity();
    return this.internals.checkValidity();
  }
  public reportValidity() {
    const valid = this.checkValidity();
    if (!valid) {
      this.focus();
    }
    return valid;
  }

  public formResetCallback() {
    this.value = this.defaultValue;
  }

  private updateValidity() {
    if (this._errorText) {
      // If the user set an error, that will always take precedence.
      this.internals.setValidity({ customError: true }, this._errorText);
    } else if (this.required && !this.value) {
      this.internals.setValidity({ valueMissing: true }, this.requiredText);
    } else if (this.formControl && !this.formControl.checkValidity()) {
      // Sync the custom control's validity with the native input's validity
      this.internals.setValidity(
        this.formControl.validity,
        this.formControl.validationMessage,
      );
    } else {
      this.internals.setValidity({});
    }
  }

  protected setFormValue(value: string | File | FormData | null) {
    // Clear form data on empty string
    value ||= null;
    // Don't add data for disabled controls
    this.internals.setFormValue(this.disabled ? null : value);
    this.updateValidity();
  }

  private handleControlEvent = (event: Event) => {
    const target = event.target as HTMLElement;
    if (this.formControl && this.formControl === target) {
      event.stopImmediatePropagation();
      this.value = this.formControl.value;
      this.dispatchEvent(
        new Event(event.type, { bubbles: true, composed: true }),
      );
    }
  };
}
