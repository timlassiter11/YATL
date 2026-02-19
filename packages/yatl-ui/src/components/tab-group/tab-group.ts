import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './tab-group.styles';

@customElement('yatl-tab-group')
export class YatlTabGroup extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public active = '';

  public setActiveTab(name: string) {
    const tabs = this.getAllTabs();
    const panels = this.getAllPanels();
    const tab = tabs.filter(t => !t.disabled).find(t => t.panel === name);
    const panel = panels.find(p => p.name === name);
    if (!tab || !panel) {
      return;
    }

    for (const tab of tabs) {
      tab.active = false;
    }
    for (const panel of panels) {
      panel.active = false;
    }

    tab.active = true;
    panel.active = true;
    this.active = name;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', event => this.handleClick(event));
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

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;
    const tab = target.closest('yatl-tab');
    if (!tab) {
      return;
    }

    this.setActiveTab(tab.panel);
  }

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
