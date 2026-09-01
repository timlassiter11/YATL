import { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { YatlFormControl } from '../form-control/form-control';

/**
 * Shared base for form controls with a boolean checked state and a single
 * value that's submitted only while checked (checkbox, switch, radio).
 */
export abstract class YatlCheckableControl extends YatlFormControl<string> {
  // This control needs to be inline
  public override inline = true;

  private _value = this.getAttribute('value') ?? 'on';
  private _checked = this.hasAttribute('checked');
  // Whether the `checked` setter has been explicitly called (from outside
  // this class) - can't rely on Lit's changedProperties for this, since on
  // the first update it contains every declared property regardless of
  // whether it was actually touched.
  private checkedExplicitlySet = false;

  /**
   * The value to store in the form data when checked.
   * @attr value
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

  /** The current check state. */
  public get checked() {
    return this._checked;
  }

  @property({ type: Boolean, attribute: false })
  public set checked(value) {
    this._checked = Boolean(value);
    this.checkedExplicitlySet = true;
    this.toggleState('checked', value);
    this.updateFormValue();
  }

  /**
   * The initial, uncontrolled check state.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true, attribute: 'checked' })
  public defaultChecked = this.hasAttribute('checked');

  public get formValue() {
    return this._checked ? this.value || 'on' : null;
  }

  protected override onFormReset() {
    this.checked = this.defaultChecked;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.updateFormValue();
  }

  protected override firstUpdated(
    changedProps: PropertyValues<YatlCheckableControl>,
  ) {
    super.firstUpdated(changedProps);
    // Only seed from defaultChecked if `checked` wasn't already set
    // explicitly (e.g. via a `.checked=${...}` binding) before this first
    // update - otherwise we'd clobber that explicit value.
    if (!this.checkedExplicitlySet) {
      this._checked = this.defaultChecked;
      this.toggleState('checked', this._checked);
    }
  }

  protected updateFormValue() {
    this.setFormValue(this.formValue);
  }

  protected handleChange(event: Event) {
    event.stopPropagation();
    this.checked = (event.target as HTMLInputElement).checked;
    this.emitInteraction('change');
  }
}
