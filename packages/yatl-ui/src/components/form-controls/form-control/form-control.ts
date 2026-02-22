import { html, LitElement, PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { HasSlotController } from '../../../utils/slot-controller';
import { classMap } from 'lit/directives/class-map.js';
import { YatlBase } from '../../base/base';
import styles from './form-control.styles';

export type FormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | YatlFormControl;

/**
 * Abstract base class for all form-associated YATL components.
 * Provides standard boilerplate for ElementInternals, validation, and layout.
 * @slot label - The label content. Replaces the `label` property.
 * @slot hint - Helper text displayed below the input. Replaces the `hint` property.
 * @slot error - Error text displayed when the input is invalid. Replaces the `error-text` property.
 * @slot start - Content to place at the start of the input block (e.g., icons).
 * @slot end - Content to place at the end of the input block.
 */
export abstract class YatlFormControl<
    TData = string,
    TInput extends FormControl = HTMLInputElement,
  >
  extends YatlBase
  implements ElementInternals
{
  public static formAssociated = true;
  public static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(
    this,
    'hint',
    'label',
    'error',
  );

  // Used to report validity
  @state() private currentValidationText = '';
  protected readonly internals: ElementInternals;

  /** Indicates if the user made any changes */
  protected hasUserInteracted = false;

  /** Used to associate the label with the control element */
  public readonly inputId = 'input';

  /**
   * A reference to the internal native form control.
   * Subclasses should ensure they either use an input
   * element, or override this with their own query.
   */
  @query('input') protected formControl?: TInput;

  @query('slot[name="label"]') protected labelSlot?: HTMLSlotElement;

  /** The name of the form control, submitted as a pair with the control's value. */
  @property({ type: String, reflect: true })
  public name = '';

  /** The label text displayed above or beside the input. */
  @property({ type: String })
  public label = '';

  /** Helper text displayed below the input. */
  @property({ type: String })
  public hint = '';

  /**
   * Custom error message to display when the control is invalid.
   * Setting this explicitly overrides native validation messages
   * and marks the input as invalid for form submission.
   */
  @property({ type: String, attribute: 'error-text' })
  public errorText = '';

  /** The default message displayed when the `required` constraint is violated. */
  @property({ type: String, attribute: 'required-text' })
  public requiredText = 'This field is required';

  /** Disables the form control, preventing interaction and form submission. */
  @property({ type: Boolean, reflect: true })
  public disabled = false;

  /** Makes the form control readonly. The value can still be submitted. */
  @property({ type: Boolean, reflect: true })
  public readonly = false;

  /** Requires the user to fill in the field before submitting the form. */
  @property({ type: Boolean, reflect: true })
  public required = false;

  /** Renders the label and input on the same line. */
  @property({ type: Boolean, reflect: true })
  public inline = false;

  /** The live data value of this input */
  public abstract value?: TData;
  /** The value to revert back to on form reset */
  public abstract defaultValue?: TData;
  /** The vlue to be stored in the form data */
  public abstract formValue: string | File | FormData | null;
  /**
   * Override to handle change and input events.
   * Return false to ignore the provided event.
   * Return true or nothing (void) to process them as changes.
   */
  protected isValidChangeEvent(_event: Event): boolean | void {}

  /** Indicates if the user has provided a label via the property or slot*/
  protected get hasLabel() {
    return this.label ? true : this.slotController.test('label');
  }

  /** Indicates if the user has provided a hint via the property or slot*/
  protected get hasHint() {
    return this.hint ? true : this.slotController.test('hint');
  }

  /**
   * Indicates if there is any error text to display.
   * Includes user error messages, slotted error messages and validation messages.
   */
  protected get hasError() {
    return (
      this.currentValidationText ||
      this.errorText ||
      this.slotController.test('error')
    );
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

  protected override willUpdate(
    changedProperties: PropertyValues<YatlFormControl<TData, TInput>>,
  ): void {
    if (!this.hasUserInteracted && changedProperties.has('defaultValue')) {
      this.value = this.defaultValue;
      this.setFormValue(this.formValue);
    }

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

    // Update form data when disabled or readonly state changes.
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('readonly')
    ) {
      this.setFormValue(this.formValue);
      this.toggleState('disabled', this.disabled);
      this.toggleState('readonly', this.readonly);
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
      <label for="input">
        <slot name="label">
          <div part="label" class=${classMap({ 'has-label': this.hasLabel })}>
            ${this.label}
          </div>
        </slot>
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
    const error = this.errorText || this.currentValidationText;
    const classes = {
      'has-error': this.hasError,
    };

    return html`
      <slot name="error">
        <span part="error" class=${classMap(classes)}>${error}</span>
      </slot>
    `;
  }

  /**
   * Subclasses must implement this to render their specific native form control.
   * Ensure `id=${this.inputId}` is applied to the native input element.
   */
  protected abstract renderInput(): unknown;

  // --- ElementInternals Implementation ---

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
      this.currentValidationText = this.validationMessage;
      this.focus();
    } else {
      this.currentValidationText = '';
    }
    return valid;
  }

  /** DON'T OVERRIDE THIS. Use onFormReset instead */
  public formResetCallback() {
    this.onFormReset();
    this.setFormValue(this.formValue);
    this.hasUserInteracted = false;
  }

  protected onFormReset() {
    this.value = this.defaultValue;
  }

  private updateValidity() {
    if (this.errorText) {
      // If the user set an error, that will always take precedence.
      this.setValidity({ customError: true }, this.errorText);
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
    if (this.isValidChangeEvent?.(event) === false) {
      return;
    }

    event.stopPropagation();
    this.hasUserInteracted = true;
    this.setFormValue(this.formValue);
    this.dispatchEvent(
      new Event(event.type, { bubbles: true, composed: true }),
    );
  };
}
