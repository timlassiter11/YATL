import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBaseFilter } from '../base-filter/base-filter';
import type { YatlSwitch } from '../../form-controls/switch/switch';

@customElement('yatl-switch-filter')
export class YatlSwitchFilter<T = string> extends YatlBaseFilter<T> {
  private _onValue?: T;
  private _offValue?: T;
  private _checked = this.hasAttribute('checked');

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
        .checked=${this.checked}
        @change=${this.handleChange}
      ></yatl-switch>
    `;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as YatlSwitch;
    this.checked = target.checked;
  }

  private updateValue() {
    this.value = this.checked ? this.onValue : this.offValue;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-switch-filter': YatlSwitchFilter<unknown>;
  }
}
