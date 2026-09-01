import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './tab-group.styles';
import {
  YatlTabChangeEvent,
  YatlTabChangeRequest,
} from '../../events/tab-group';

/**
 * @fires yatl-tab-change-request - Fired before the active tab changes. Cancellable.
 * @fires yatl-tab-change - Fired after the active tab changes.
 */
@customElement('yatl-tab-group')
export class YatlTabGroup extends YatlBase {
  public static override styles = [...super.styles, styles];

  /** The panel name of the currently active tab. */
  @property({ type: String })
  public active = '';

  /**
   * Activates the tab/panel pair matching `name`. A `yatl-tab` is optional -
   * a matching `yatl-tab-panel` is required. Returns whether a matching
   * panel was found and activated.
   */
  public setActiveTab(name: string) {
    const tabs = this.getAllTabs();
    const panels = this.getAllPanels();
    const tab = tabs.filter(t => !t.disabled).find(t => t.panel === name);
    const panel = panels.find(p => p.name === name);

    if (panel == undefined) {
      // We allow for not having a tab but we have to have a panel.
      return false;
    }

    for (const tab of tabs) {
      tab.active = false;
    }
    for (const panel of panels) {
      panel.active = false;
    }

    if (tab) {
      tab.active = true;
    }

    panel.active = true;
    this.active = name;
    return true;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.handleClick);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleClick);
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlTabGroup>,
  ): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('active')) {
      this.setActiveTab(this.active);
    }
  }

  protected override render() {
    return html`
      <div part="tabs" role="tablist">
        <slot name="tabs"></slot>
      </div>
      <div part="body">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  private handleSlotChange() {
    const tabs = this.getAllTabs();
    const activeTab = this.active
      ? tabs.find(t => t.panel === this.active)
      : undefined;

    const name = activeTab?.panel ?? tabs.at(0)?.panel;
    if (name) {
      this.setActiveTab(name);
    }
  }

  private handleClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const tab = target.closest('yatl-tab');
    if (!tab || tab.disabled || tab.panel === this.active) {
      return;
    }

    const request = new YatlTabChangeRequest(tab.panel);
    this.dispatchEvent(request);
    if (request.defaultPrevented) {
      return;
    }

    if (this.setActiveTab(tab.panel)) {
      this.dispatchEvent(new YatlTabChangeEvent(tab.panel));
    }
  };

  private getAllTabs() {
    return [...this.querySelectorAll('yatl-tab')];
  }

  private getAllPanels() {
    return [...this.querySelectorAll('yatl-tab-panel')];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-tab-group': YatlTabGroup;
  }
}
