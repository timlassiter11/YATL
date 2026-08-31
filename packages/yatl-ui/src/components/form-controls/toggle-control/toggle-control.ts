import { property } from 'lit/decorators.js';
import { YatlCheckableControl } from '../checkable-control/checkable-control';

/**
 * Shared base for on/off toggle controls (checkbox, switch) that can
 * optionally submit a distinct value while unchecked.
 */
export abstract class YatlToggleControl extends YatlCheckableControl {
  private _uncheckedValue?: string;

  /**
   * The value to store in the form data when *not* checked.
   * *NOTE*: Only used when `always-include` is set.
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
   * If set, the `unchecked-value` will be submitted when not checked.
   * @attr always-include
   */
  @property({ type: Boolean, attribute: 'always-include' })
  public alwaysInclude = false;

  public override get formValue() {
    if (this.checked) {
      return this.value || 'on';
    } else if (this.alwaysInclude) {
      return this.uncheckedValue ?? 'off';
    }
    return null;
  }
}
