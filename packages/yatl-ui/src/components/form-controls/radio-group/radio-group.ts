import { html, PropertyValues } from 'lit';
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

/**
 * @fires change - Fired when the selected child's value changes.
 */
@customElement('yatl-radio-group')
export class YatlRadioGroup extends YatlFormControl<string> {
  public static override styles = [...super.styles, styles];

  /**
   * The initial, uncontrolled value of the group. Computed automatically
   * from `value` (or a pre-checked child) on first render (see
   * firstUpdated()) - only set this directly if you need to override that.
   * @attr value
   */
  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  /** The current, controlled value of the group. */
  @property({ type: String, attribute: false })
  public value = this.initialAttributeValue('value', '');

  public override get formValue() {
    return this.value;
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlRadioGroup>,
  ) {
    super.willUpdate(changedProperties);

    if (changedProperties.has('disabled')) {
      this.propagateDisabled();
    }

    if (!this.hasUpdated) {
      const children = this.getAllChildren();
      if (!this.value) {
        // If the user didnt provide a default value
        // look for the first one that is checked and use that.
        // Children wont have been upgraded yet so
        // just use the attributes, not the props.
        const defaultChild = children.find(c => c.hasAttribute('checked'));
        const defaultValue = defaultChild?.getAttribute('value');
        if (defaultValue != null) {
          this.value = defaultValue;
        }
      }

      for (const child of children) {
        const childValue = child.getAttribute('value');
        child.toggleAttribute('checked', childValue === this.value);
      }
    }
  }

  protected override firstUpdated(
    changedProperties: PropertyValues<YatlRadioGroup>,
  ) {
    super.firstUpdated(changedProperties);
    // Capture whatever value ended up set (via property/attribute, or a
    // pre-checked child, per the willUpdate() logic above) by the time we
    // first render as the "default" to revert to on form reset. This has
    // to happen here rather than as a field initializer, since `value` may
    // have been set via a JS property before the element was even
    // connected - reading the attribute in the constructor would miss
    // that and always compute an empty default.
    if (this.value) {
      this.defaultValue = this.value;
    }
  }

  /**
   * Called by the browser when an ancestor `<fieldset disabled>`'s
   * disabled state changes. Also propagates to children, since a
   * disabled group should behave the same way regardless of whether
   * it was disabled directly or via an ancestor fieldset.
   */
  public override formDisabledCallback(disabled: boolean) {
    super.formDisabledCallback(disabled);
    this.propagateDisabled();
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base" @change=${this.handleChange}>${this.renderInput()}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`<slot
      part="group"
      @slotchange=${this.syncChildStates}
    ></slot> `;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    if (event.type !== 'change') {
      return;
    }

    const target = event.target as SupportedChildren;
    // Allow no inputs to be checked if this isn't required
    if (!this.required && !target.checked) {
      this.value = '';
    } else {
      this.value = target.value;
    }
    this.syncChildStates();
    this.emitInteraction('change');
  }

  private syncChildStates() {
    // A child could have been added after the group was disabled, so
    // make sure it picks up the current effective disabled state too.
    this.propagateDisabled();

    for (const element of this.getAllChildren()) {
      element.checked = element.value === this.value;
    }
  }

  /**
   * Propagates this group's effective disabled state to its children,
   * the same way an ancestor `<fieldset disabled>` would: without
   * touching each child's own `disabled` property.
   */
  private propagateDisabled() {
    for (const child of this.getAllChildren(true)) {
      if ('formDisabledCallback' in child) {
        child.formDisabledCallback(this.isDisabled);
      } else {
        // Plain <input> elements have no such hook to call instead.
        child.disabled = this.isDisabled;
      }
    }
  }

  private getAllChildren(includeDisabled = false) {
    // Deep-query (rather than just direct children) so children wrapped
    // in a layout element are still found, but exclude anything assigned
    // to a named slot (e.g. our own `label` slot) and anything that
    // doesn't actually look like a checkable control.
    const elements = [...this.querySelectorAll('*:not([slot])')].filter(
      isCheckableElement,
    );

    if (includeDisabled) {
      return elements;
    }
    return elements.filter(c => !c.disabled);
  }
}

function isCheckableElement(element: Element): element is SupportedChildren {
  return 'checked' in element && 'value' in element && 'disabled' in element;
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-radio-group': YatlRadioGroup;
  }
}
