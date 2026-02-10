import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { YatlSwitch } from '../yatl-switch';

import styles from './yatl-radio-group.styles';

@customElement('yatl-radio-group')
export class YatlRadioGroup extends YatlFormControl<string> {
  public static override styles = [...YatlFormControl.styles, styles];

  @property({ type: String, attribute: 'value' })
  public defaultValue = this.getAttribute('value') ?? '';

  @property({ type: String, attribute: false })
  public value = this.getAttribute('value') ?? '';

  public override get formValue() {
    return this.value;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    if (!this.value) {
      const children = this.getAllChildren();
      const defaultChild = children.find(c => c.hasAttribute('checked')) ?? children.at(0);
      const defaultValue = defaultChild?.getAttribute('value');
      if (defaultValue) {
        this.value = defaultValue;
      }

      for (const child of children) {
        child.toggleAttribute('checked', child.getAttribute('value') === this.value);
      }
    }
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base">${this.renderInput()}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`<slot @slotchange=${this.syncChildStates}></slot> `;
  }

  protected override onValueChange(event: Event) {
    event.stopPropagation();
    if (event.type === 'change') {
      const target = event.target as YatlSwitch;
      this.value = target.value;
      this.syncChildStates();
      return false;
    }
    return true;
  }

  private handleSlotChange() {

  }

  private syncChildStates() {
    for (const element of this.getAllChildren()) {
      element.checked = element.value === this.value;
    }
  }

  private getAllChildren(includeDisabled = false) {
    const elements = [...this.querySelectorAll<YatlSwitch>('yatl-switch')];
    if (includeDisabled) {
      return elements;
    }
    return elements.filter(c => !c.disabled);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-radio-group': YatlRadioGroup;
  }
}
