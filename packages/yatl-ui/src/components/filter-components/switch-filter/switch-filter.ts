import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBaseFilter } from '../base-filter/base-filter';
import type { YatlSwitch } from '../../form-controls/switch/switch';

@customElement('yatl-switch-filter')
export class YatlSwitchFilter extends YatlBaseFilter<unknown> {
  // Redeclared with this filter's type, so template type checkers
  // (like lit-analyzer) don't see the base class's generic TValue.
  // It only passes through to YatlBaseFilter's value.
  /**
   * The filter value: `onValue` when checked, `offValue` when not. Set it with `checked`.
   */
  public override get value(): unknown {
    return super.value;
  }
  public override set value(value: unknown) {
    super.value = value;
  }

  private _onValue?: unknown;
  private _offValue?: unknown;
  private _checked = this.hasAttribute('checked');

  /** The filter value applied when the switch is checked. */
  @property({ attribute: false })
  public get onValue() {
    return this._onValue;
  }
  public set onValue(value) {
    if (this._onValue === value) {
      return;
    }

    const oldValue = this._onValue;
    this._onValue = value;
    this.updateValue();
    this.requestUpdate('onValue', oldValue);
  }

  /** The filter value applied when the switch is unchecked. */
  @property({ attribute: false })
  public get offValue() {
    return this._offValue;
  }
  public set offValue(value) {
    if (this._offValue === value) {
      return;
    }

    const oldValue = this._offValue;
    this._offValue = value;
    this.updateValue();
    this.requestUpdate('offValue', oldValue);
  }

  /** The current check state of the switch. */
  @property({ attribute: false })
  public get checked() {
    return this._checked;
  }
  public set checked(value) {
    if (this._checked === value) {
      return;
    }

    const oldValue = this._checked;
    this._checked = value;
    this.updateValue();
    this.requestUpdate('checked', oldValue);
  }

  protected override render() {
    return html`
      <yatl-switch
        name=${this.field}
        label=${this.label}
        ?disabled=${this.disabled}
        ?checked=${this._checked}
        .checked=${this.checked}
        @change=${this.handleChange}
      ></yatl-switch>
    `;
  }

  protected override reset() {
    // Show the position that means "no filter", so the switch doesn't look
    // on while nothing is filtered: off when there's no offValue, on when
    // there's no onValue. With both set neither position is unfiltered, so
    // it goes back to its initial position.
    //
    // Go through the base class to actually clear the value - going through
    // the `checked` setter would re-derive onValue/offValue and immediately
    // reapply a filter, defeating an external clear (e.g. "Clear Filters").
    const oldValue = this._checked;
    if (this.offValue === undefined) {
      this._checked = false;
    } else if (this.onValue === undefined) {
      this._checked = true;
    } else {
      this._checked = this.hasAttribute('checked');
    }
    this.requestUpdate('checked', oldValue);
    super.reset();
  }

  private handleChange(event: Event) {
    const target = event.target as YatlSwitch;
    this.checked = target.checked;
  }

  private updateValue() {
    this.value = this.checked ? this.onValue : this.offValue;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-switch-filter': YatlSwitchFilter;
  }
}
