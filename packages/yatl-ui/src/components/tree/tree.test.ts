import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlTree } from './tree';
import { YatlTreeItem } from '../tree-item/tree-item';

function selectItem(item: YatlTreeItem) {
  const summary = item.shadowRoot!.querySelector('summary')!;
  summary.click();
}

function toggleItem(item: YatlTreeItem) {
  const button = item.shadowRoot!.querySelector('yatl-button')!;
  (button as HTMLElement).click();
}

describe('YatlTree - single selection', () => {
  test('selecting an item selects it and deselects the previous one', async () => {
    document.body.innerHTML = `
      <yatl-tree>
        <yatl-tree-item value="a">A</yatl-tree-item>
        <yatl-tree-item value="b">B</yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const [a, b] = [
      ...tree.querySelectorAll('yatl-tree-item'),
    ] as YatlTreeItem[];
    await tree.updateComplete;

    selectItem(a);
    expect(a.selected).toBe(true);
    expect(tree.selectedItems).toEqual([a]);

    selectItem(b);
    expect(a.selected).toBe(false);
    expect(b.selected).toBe(true);
    expect(tree.selectedItems).toEqual([b]);
  });

  test('clicking the already-selected item in single mode keeps it selected', async () => {
    document.body.innerHTML = `
      <yatl-tree>
        <yatl-tree-item value="a">A</yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const a = tree.querySelector<YatlTreeItem>('yatl-tree-item')!;
    await tree.updateComplete;

    selectItem(a);
    selectItem(a);

    expect(a.selected).toBe(true);
    expect(tree.selectedItems).toEqual([a]);
  });

  test('a cancelled selection-change-request leaves selection unchanged', async () => {
    document.body.innerHTML = `
      <yatl-tree>
        <yatl-tree-item value="a">A</yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const a = tree.querySelector<YatlTreeItem>('yatl-tree-item')!;
    await tree.updateComplete;
    tree.addEventListener('yatl-selection-change-request', e =>
      e.preventDefault(),
    );

    selectItem(a);

    expect(a.selected).toBe(false);
    expect(tree.selectedItems).toEqual([]);
  });

  test('a disabled item cannot be selected', async () => {
    document.body.innerHTML = `
      <yatl-tree>
        <yatl-tree-item value="a" disabled>A</yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const a = tree.querySelector<YatlTreeItem>('yatl-tree-item')!;
    await tree.updateComplete;

    selectItem(a);

    expect(a.selected).toBe(false);
  });
});

describe('YatlTree - multi selection', () => {
  test('multiple items can be selected independently', async () => {
    document.body.innerHTML = `
      <yatl-tree selection-method="multi">
        <yatl-tree-item value="a">A</yatl-tree-item>
        <yatl-tree-item value="b">B</yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const [a, b] = [
      ...tree.querySelectorAll('yatl-tree-item'),
    ] as YatlTreeItem[];
    await tree.updateComplete;

    selectItem(a);
    selectItem(b);

    expect(a.selected).toBe(true);
    expect(b.selected).toBe(true);
    expect(new Set(tree.selectedItems)).toEqual(new Set([a, b]));
  });

  test('selecting an already-selected item in multi mode deselects it', async () => {
    document.body.innerHTML = `
      <yatl-tree selection-method="multi">
        <yatl-tree-item value="a">A</yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const a = tree.querySelector<YatlTreeItem>('yatl-tree-item')!;
    await tree.updateComplete;

    selectItem(a);
    expect(a.selected).toBe(true);

    selectItem(a);
    expect(a.selected).toBe(false);
    expect(tree.selectedItems).toEqual([]);
  });
});

describe('YatlTree - expand/collapse', () => {
  test('the toggle button expands/collapses without selecting the item', async () => {
    document.body.innerHTML = `
      <yatl-tree>
        <yatl-tree-item value="a">
          A
          <yatl-tree-item value="a1" slot="children">A1</yatl-tree-item>
        </yatl-tree-item>
      </yatl-tree>
    `;
    const tree = document.querySelector<YatlTree>('yatl-tree')!;
    const a = tree.querySelector<YatlTreeItem>('yatl-tree-item[value="a"]')!;
    await tree.updateComplete;

    expect(a.open).toBe(false);

    toggleItem(a);

    expect(a.open).toBe(true);
    expect(a.selected).toBe(false);
    expect(tree.selectedItems).toEqual([]);
  });
});
