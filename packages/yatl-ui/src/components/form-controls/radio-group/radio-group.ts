import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { YatlCheckbox } from '../checkbox/checkbox';
import { YatlFormControl } from '../form-control/form-control';
import type { YatlRadio } from '../radio/radio';
import type { YatlSwitch } from '../switch/switch';
import styles from './radio-group.styles';

type SupportedChildren =
  | HTMLInputElement
  | YatlRadio
  | YatlSwitch
  | YatlCheckbox;

@customElement('yatl-radio-group')
export class YatlRadioGroup extends YatlFormControl<string> {
  public static override styles = [...super.styles, styles];

  @property({ type: String, attribute: 'value' })
  public defaultValue = this.getAttribute('value') ?? '';

  @property({ type: String, attribute: false })
  public value = this.getAttribute('value') ?? '';

  public override get formValue() {
    return this.value;
  }

  public override connectedCallback(): void {
    super.connectedCallback();

    // Children wont have been upgraded yet so
    // just use the attributes, not the props.
    if (!this.value) {
      // If the user didnt provide a default value
      // look for the first one that is checked and use that.
      const children = this.getAllChildren();
      let defaultChild = children.find(c => c.hasAttribute('checked'));

      // None checked and field is required, use first option.
      if (!defaultChild && this.required) {
        defaultChild = children.at(0);
      }

      const defaultValue = defaultChild?.getAttribute('value');
      if (defaultValue) {
        this.value = defaultValue;
      }

      for (const child of children) {
        const childValue = child.getAttribute('value');
        child.toggleAttribute('checked', childValue === this.value);
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
    return html`<slot
      part="group"
      @slotchange=${this.syncChildStates}
    ></slot> `;
  }

  protected override onValueChange(event: Event) {
    event.stopPropagation();
    if (event.type === 'change') {
      const target = event.target as SupportedChildren;
      // Allow no inputs to be checked if this isn't required
      if (!this.required && !target.checked) {
        this.value = '';
      } else {
        this.value = target.value;
      }
      this.syncChildStates();
      return false;
    }
    return true;
  }

  private syncChildStates() {
    for (const element of this.getAllChildren()) {
      element.checked = element.value === this.value;
    }
  }

  private getAllChildren(includeDisabled = false) {
    const elements = [...this.querySelectorAll<SupportedChildren>('*')];
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
