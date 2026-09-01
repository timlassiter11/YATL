import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlTabGroup } from './tab-group';
import { YatlTab } from '../tab/tab';
import { YatlTabPanel } from '../tab-panel/tab-panel';
import {
  YatlTabChangeEvent,
  YatlTabChangeRequest,
} from '../../events/tab-group';

async function renderTabGroup(attrs = '') {
  document.body.innerHTML = `
    <yatl-tab-group ${attrs}>
      <yatl-tab slot="tabs" panel="one">One</yatl-tab>
      <yatl-tab slot="tabs" panel="two">Two</yatl-tab>
      <yatl-tab slot="tabs" panel="three" disabled>Three</yatl-tab>
      <yatl-tab-panel name="one">Panel one</yatl-tab-panel>
      <yatl-tab-panel name="two">Panel two</yatl-tab-panel>
      <yatl-tab-panel name="three">Panel three</yatl-tab-panel>
    </yatl-tab-group>
  `;
  const el = document.querySelector<YatlTabGroup>('yatl-tab-group')!;
  await el.updateComplete;
  // slotchange fires asynchronously after the initial connection.
  await new Promise(r => setTimeout(r, 0));
  return el;
}

function tabs(el: YatlTabGroup) {
  return [...el.querySelectorAll('yatl-tab')] as YatlTab[];
}

function panels(el: YatlTabGroup) {
  return [...el.querySelectorAll('yatl-tab-panel')] as YatlTabPanel[];
}

function tab(el: YatlTabGroup, panel: string) {
  return tabs(el).find(t => t.panel === panel)!;
}

function panel(el: YatlTabGroup, name: string) {
  return panels(el).find(p => p.name === name)!;
}

describe('YatlTabGroup - initial state', () => {
  test('the first tab activates by default when no active attribute is set', async () => {
    const el = await renderTabGroup();
    expect(tab(el, 'one').active).toBe(true);
    expect(panel(el, 'one').active).toBe(true);
  });

  test('the active attribute selects the matching tab/panel on connect', async () => {
    const el = await renderTabGroup('active="two"');
    expect(tab(el, 'two').active).toBe(true);
    expect(panel(el, 'two').active).toBe(true);
    expect(tab(el, 'one').active).toBe(false);
  });
});

describe('YatlTabGroup - click interaction', () => {
  test('clicking a tab activates it and its panel, deactivating the previous one', async () => {
    const el = await renderTabGroup();

    tab(el, 'two').click();
    await el.updateComplete;

    expect(tab(el, 'two').active).toBe(true);
    expect(panel(el, 'two').active).toBe(true);
    expect(tab(el, 'one').active).toBe(false);
    expect(panel(el, 'one').active).toBe(false);
    expect(el.active).toBe('two');
  });

  test('clicking a disabled tab does not change the active tab', async () => {
    const el = await renderTabGroup();

    tab(el, 'three').click();
    await el.updateComplete;

    expect(tab(el, 'three').active).toBe(false);
    expect(panel(el, 'three').active).toBe(false);
    expect(tab(el, 'one').active).toBe(true);
  });

  test('clicking the already-active tab does not fire change events', async () => {
    const el = await renderTabGroup();

    let requestCount = 0;
    let changeCount = 0;
    el.addEventListener('yatl-tab-change-request', () => requestCount++);
    el.addEventListener('yatl-tab-change', () => changeCount++);

    tab(el, 'one').click();
    await el.updateComplete;

    expect(requestCount).toBe(0);
    expect(changeCount).toBe(0);
  });
});

describe('YatlTabGroup - change events', () => {
  test('clicking a tab fires yatl-tab-change-request then yatl-tab-change with the panel name', async () => {
    const el = await renderTabGroup();

    const order: string[] = [];
    let requestTab: string | undefined;
    let changeTab: string | undefined;
    el.addEventListener(
      'yatl-tab-change-request',
      (e: YatlTabChangeRequest) => {
        order.push('request');
        requestTab = e.tab;
      },
    );
    el.addEventListener('yatl-tab-change', (e: YatlTabChangeEvent) => {
      order.push('change');
      changeTab = e.tab;
    });

    tab(el, 'two').click();
    await el.updateComplete;

    expect(order).toEqual(['request', 'change']);
    expect(requestTab).toBe('two');
    expect(changeTab).toBe('two');
  });

  test('preventing default on the request stops the tab from changing', async () => {
    const el = await renderTabGroup();
    el.addEventListener('yatl-tab-change-request', e => e.preventDefault());

    let changed = false;
    el.addEventListener('yatl-tab-change', () => (changed = true));

    tab(el, 'two').click();
    await el.updateComplete;

    expect(changed).toBe(false);
    expect(tab(el, 'one').active).toBe(true);
    expect(tab(el, 'two').active).toBe(false);
  });
});

describe('YatlTabGroup - setActiveTab', () => {
  test('returns true and activates the panel for a valid name', async () => {
    const el = await renderTabGroup();
    expect(el.setActiveTab('two')).toBe(true);
    expect(panel(el, 'two').active).toBe(true);
  });

  test('returns false and leaves the current tab untouched for an unknown name', async () => {
    const el = await renderTabGroup();
    expect(el.setActiveTab('does-not-exist')).toBe(false);
    expect(tab(el, 'one').active).toBe(true);
    expect(panel(el, 'one').active).toBe(true);
  });

  test('a tab is optional - a name matching only a panel still activates', async () => {
    document.body.innerHTML = `
      <yatl-tab-group>
        <yatl-tab-panel name="only">Panel</yatl-tab-panel>
      </yatl-tab-group>
    `;
    const el = document.querySelector<YatlTabGroup>('yatl-tab-group')!;
    await el.updateComplete;

    expect(el.setActiveTab('only')).toBe(true);
    expect(panel(el, 'only').active).toBe(true);
  });
});
