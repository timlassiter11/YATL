import { html, LitElement, nothing, PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { HasSlotController } from '../../../utils/slot-controller';
import { classMap } from 'lit/directives/class-map.js';
import { YatlBase } from '../../base/base';
import { YatlEvent } from '@timlassiter11/yatl';

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
export abstract class YatlFormControl<TData = string>
  extends YatlBase
  implements ElementInternals
{
  public static formAssociated = true;
  public static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  public static override styles = [...super.styles, styles];

  /** Used to associate the label with the control element */
  public readonly inputId = 'input';

  // Flag indicating if the user has made any changes
  private hasUserInteracted = false;

  private slotController = new HasSlotController(
    this,
    'hint',
    'label',
    'error',
  );

  // Used to report validity
  @state() private currentValidationText = '';
  // Whether an ancestor <fieldset disabled> has disabled this control.
  // See formDisabledCallback() / isDisabled.
  @state() private internalsDisabled = false;
  protected readonly internals: ElementInternals;

  /**
   * A reference to the internal native form control.
   * Subclasses should ensure their native form control has
   * `id=${this.inputId}` (i.e. `id="input"`), or override this
   * with their own query.
   */
  @query('#input') protected formControl?: HTMLElement;

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
   * @attr error-text
   */
  @property({ type: String, attribute: 'error-text' })
  public errorText = '';

  /**
   * The default message displayed when the `required` constraint is violated.
   * @attr required-text
   */
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
    root.addEventListener('keydown', this.handleKeyDown as EventListener);
    return root;
  }

  protected override willUpdate(changedProps: PropertyValues<YatlFormControl>) {
    if (
      changedProps.has('defaultValue') &&
      !changedProps.has('value') &&
      !this.hasUserInteracted
    ) {
      this.value = this.defaultValue;
      this.setFormValue(this.formValue);
    }

    // Update form data when disabled or readonly change. (Fieldset-driven
    // disabling is handled separately in formDisabledCallback(), since
    // internalsDisabled is private and so can't appear in `changedProps`.)
    if (changedProps.has('disabled') || changedProps.has('readonly')) {
      this.setFormValue(this.formValue);
      this.toggleState('disabled', this.isDisabled);
      this.toggleState('readonly', this.readonly);
    }
  }

  protected override updated(changedProps: PropertyValues<YatlFormControl>) {
    if (changedProps.has('value')) {
      // setFormValue() also updates validity, so there's no need to
      // call updateValidity() separately below in this case.
      this.setFormValue(this.formValue);
    } else if (
      changedProps.has('requiredText') ||
      changedProps.has('errorText') ||
      changedProps.has('required')
    ) {
      this.updateValidity();
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
      <div part="base" class="base text-input">
        <slot part="start" class="input-start" name="start"></slot>
        ${contents}
        <slot part="end" class="input-end" name="end"></slot>
      </div>
    `;
  }

  protected renderLabel(): unknown {
    const classes = { 'has-label': this.hasLabel };
    return html`
      <yatl-label
        for=${this.inputId}
        exportparts="base:label"
        class=${classMap(classes)}
      >
        <slot name="label">${this.label}</slot>
        ${this.renderLabelEnd()}
      </yatl-label>
    `;
  }

  /**
   * Trailing content rendered in the label's `end` slot, e.g. a character
   * count. Overridden by subclasses that need it - renders nothing by
   * default.
   */
  protected renderLabelEnd(): unknown {
    return nothing;
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

  public setFormValue(
    value: string | File | FormData | null,
    state?: string | File | FormData | null,
  ) {
    // Clear form data on empty string
    value ||= null;
    // Don't submit a value for disabled controls, but still track state
    // (defaulting to the un-nulled value) so autofill/bfcache restoration
    // still works correctly if the control becomes enabled again later.
    this.internals.setFormValue(this.isDisabled ? null : value, state ?? value);
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

  /**
   * Called by the browser when an ancestor `<fieldset disabled>`'s
   * disabled state changes. This is independent of the `disabled`
   * property - don't call it directly, and use `isDisabled` (not
   * `disabled`) for anything that should also respect it.
   */
  public formDisabledCallback(disabled: boolean) {
    this.internalsDisabled = disabled;
    // internalsDisabled is private, so it can't appear in `changedProps`
    // for willUpdate() to react to - do the same sync here directly.
    this.setFormValue(this.formValue);
    this.toggleState('disabled', this.isDisabled);
  }

  /**
   * Whether this control is actually disabled: either `disabled` is set
   * directly, or an ancestor `<fieldset disabled>` disabled it. Subclasses
   * should use this - not `disabled` - for anything that affects behavior
   * or rendering, since `disabled` alone misses the fieldset case.
   */
  public get isDisabled() {
    return this.disabled || this.internalsDisabled;
  }

  protected updateValidity() {
    if (this.errorText) {
      // If the user set an error, that will always take precedence.
      this.setValidity({ customError: true }, this.errorText);
    } else if (this.required && !this.value) {
      this.setValidity({ valueMissing: true }, this.requiredText);
    } else if (isValidationElement(this.formControl)) {
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

  protected emitInteraction(type: 'change' | 'input', newValue?: TData) {
    if (newValue !== undefined) {
      this.value = newValue;
    }

    this.hasUserInteracted = true;
    this.dispatchEvent(new YatlEvent(type));
  }

  /**
   * Reads an attribute's initial value directly, for use in a field
   * initializer where Lit's own attribute-to-property sync can't be relied
   * on yet - a field initializer's own assignment is indistinguishable from
   * an explicit external set in `changedProperties` on the first render, so
   * anything seeded that way in willUpdate()/firstUpdated() can silently
   * lose the attribute-driven case. Only correct when called directly from
   * a field initializer, before the constructor returns.
   */
  protected initialAttributeValue<T = string>(
    name: string,
    fallback: T,
    transform?: (raw: string) => T,
  ): T {
    const raw = this.getAttribute(name);
    if (raw === null) {
      return fallback;
    }
    return transform ? transform(raw) : (raw as unknown as T);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && event.target === this.formControl) {
      this.form?.requestSubmit();
    }
  };
}

interface ValidationElement {
  checkValidity: () => boolean;
  validity: ValidityState;
  validationMessage: string;
}

function isValidationElement(
  element: object | undefined,
): element is ValidationElement {
  return (
    element != null &&
    'checkValidity' in element &&
    typeof element.checkValidity === 'function' &&
    'validationMessage' in element &&
    typeof element.validationMessage === 'string' &&
    'validity' in element
  );
}
