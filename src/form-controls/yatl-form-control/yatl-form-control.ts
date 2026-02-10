import { html, LitElement, PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { HasSlotController } from '../../utils/slot-controller';

import theme from '../../theme';
import styles from './yatl-form-control.styles';
import { classMap } from 'lit/directives/class-map.js';

export type FormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | YatlFormControl;

export abstract class YatlFormControl<
    TData = string,
    TInput extends FormControl = HTMLInputElement,
  >
  extends LitElement
  implements ElementInternals
{
  public static formAssociated = true;
  public static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  public static override styles = [theme, styles];

  protected readonly internals: ElementInternals;
  private slotController = new HasSlotController(
    this,
    'hint',
    'label',
    'error',
  );

  /**
   * Used to associate the label with the control element
   */
  public readonly inputId = 'input';

  @query('input')
  protected formControl?: TInput;
  @query('slot[name="label"]')
  protected labelSlot?: HTMLSlotElement;
  @query('slot[name=""]')
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

  public abstract value?: TData;
  public abstract defaultValue?: TData;
  public abstract formValue: string | File | FormData | null;
  protected onValueChange(_event: Event): boolean | void {}

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

  protected get hasLabel() {
    return this.label ? true : this.slotController.test('label');
  }

  protected get hasHint() {
    return this.hint ? true : this.slotController.test('hint');
  }

  protected get hasError() {
    return this.errorText ? true : this.slotController.test('error');
  }

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  protected override createRenderRoot() {
    const root = super.createRenderRoot();
    root.addEventListener('input', this.handleInputChange);
    root.addEventListener('change', this.handleInputChange);
    return root;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    if (!this.value && this.defaultValue) {
      this.value = this.defaultValue;
    }
    this.setFormValue(this.formValue);
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

    // Update form data when disabled state changes.
    if (changedProperties.has('disabled')) {
      this.setFormValue(this.formValue);
      this.toggleState('disabled', this.disabled);
    }
  }

  protected override render() {
    return html`
      ${this.renderLabel()} ${this.renderBase(this.renderInput())}
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected renderBase(contents: unknown) {
    return html`
      <div part="base" class="text-input">
        <slot part="start" name="start"></slot>
        ${contents}
        <slot part="end" name="end"></slot>
      </div>
    `;
  }

  protected renderLabel(): unknown {
    return html`
      <label
        part="label"
        for="input"
        class=${classMap({ 'has-label': this.hasLabel })}
      >
        <slot name="label"> ${this.label} </slot>
      </label>
    `;
  }

  protected renderHint(): unknown {
    return html`
      <slot
        name="hint"
        class=${classMap({ 'has-hint': this.hasHint && !this.hasError })}
      >
        <span part="hint">${this.hint}</span>
      </slot>
    `;
  }

  protected renderErrorText(): unknown {
    return html`
      <slot name="error" class=${classMap({'has-error': this.hasError})}>
        <span part="error">${this.errorText}</span>
      </slot>
    `;
  }

  protected abstract renderInput(): unknown;

  protected get hasErrorText() {
    return !!this.errorText;
  }

  public get labels() {
    return this.internals.labels;
  }

  public get states() {
    return this.internals.states;
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

  public get form() {
    return this.internals.form;
  }

  public setFormValue(value: string | File | FormData | null) {
    // Clear form data on empty string
    value ||= null;
    // Don't add data for disabled controls
    this.internals.setFormValue(this.disabled ? null : value);
    this.updateValidity();
  }

  public setValidity(
    flags?: ValidityStateFlags,
    message?: string,
    anchor?: HTMLElement,
  ): void {
    this.internals.setValidity(flags, message, anchor);
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
      this.setValidity({ customError: true }, this._errorText);
    } else if (this.required && !this.value) {
      this.setValidity({ valueMissing: true }, this.requiredText);
    } else if (this.formControl && !this.formControl.checkValidity()) {
      // Sync the custom control's validity with the native input's validity
      this.setValidity(
        this.formControl.validity,
        this.formControl.validationMessage,
      );
    } else {
      this.setValidity({});
    }
  }

  protected toggleState(name: string, state?: boolean) {
    state ??= !this.states.has(name);
    if (state) {
      this.states.add(name);
    } else {
      this.states.delete(name);
    }
  }

  private handleInputChange = (event: Event) => {
    if (this.onValueChange?.(event)) {
      return;
    }

    event.stopPropagation();
    this.setFormValue(this.formValue);
    this.dispatchEvent(
      new Event(event.type, { bubbles: true, composed: true }),
    );
  };
}
