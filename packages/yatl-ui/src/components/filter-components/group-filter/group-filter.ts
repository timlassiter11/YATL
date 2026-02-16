import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBaseFilter } from '../base-filter/base-filter';
import { YatlSwitchFilter } from '../switch-filter/switch-filter';

import styles from './group-filter.styles';

@customElement('yatl-group-filter')
export class YatlGroupFilter extends YatlBaseFilter<unknown | unknown[]> {
  public static override styles = [styles];

  @property({ type: Boolean })
  public required = false;

  @property({ type: Boolean })
  public multi = false;

  public override createRenderRoot() {
    const root = super.createRenderRoot();
    root.addEventListener('change', this.handleChange);
    return root;
  }

  protected override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    // If no value was provide try to get one from pre-checked switches.
    if (!this.value) {
      const allChildren = this.getAllChildren();
      const checkedChildren = allChildren.filter(c => c.checked);
      if (checkedChildren.length) {
        this.value = this.multi
          ? checkedChildren.map(c => c.value)
          : checkedChildren[0].value;
      } else if (this.required) {
        const firstChild = allChildren[0];
        if (firstChild) {
          this.value = this.multi ? [firstChild.value] : firstChild.value;
        }
      }
    }
  }

  protected override render() {
    return html`
      <label part="label"> ${this.label} </label>
      <div part="group">
        <slot @slotchange=${this.syncChildStates}></slot>
      </div>
    `;
  }

  protected override reset() {
    super.reset();
    this.syncChildStates();
  }

  private handleChange = (event: Event) => {
    event.stopPropagation();
    const target = event.target as YatlSwitchFilter;

    if (!this.multi) {
      if (target.checked) {
        this.value = target.value;
      } else if (!this.required) {
        // Only allow unchecking a single value if not required
        this.value = undefined;
      }
    } else {
      // Calculate values from underlying filters
      const values = new Set<unknown>();
      const allChildren = this.getAllChildren();
      for (const child of allChildren) {
        const value = child.value;
        if (value !== undefined) {
          values.add(value);
        }
      }

      // Only apply new value if we have a new value or this filter isn't required.
      // Ignore otherwise and allow syncChildStates to correct the check state.
      if (values.size > 0 || !this.required) {
        this.value = [...values];
      }
    }

    this.syncChildStates();
  };

  private syncChildStates() {
    const value = this.value;
    const isArray = Array.isArray(value);
    for (const element of this.getAllChildren()) {
      if (this.multi && isArray) {
        element.checked =
          element.value !== undefined && value.includes(element.value);
      } else {
        element.checked =
          this.value !== undefined && element.value === this.value;
      }
    }
  }

  private getAllChildren(includeDisabled = false) {
    const elements = [...this.querySelectorAll<YatlSwitchFilter>('*')];
    if (includeDisabled) {
      return elements;
    }
    return elements.filter(c => !c.disabled);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-group-filter': YatlGroupFilter;
  }
}
