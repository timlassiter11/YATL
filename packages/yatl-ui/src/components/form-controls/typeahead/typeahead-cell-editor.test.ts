import { html } from 'lit';
import { live } from 'lit/directives/live.js';
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  CellEditor,
  NestedKeyOf,
  YatlTable,
  YatlTableController,
} from '@timlassiter11/yatl';

import '../../../index';
import { YatlTypeahead } from './typeahead';

interface Row {
  id: number;
  status: string;
  other: string;
}

// Only reports on `change`, like any editor built around a form control that
// has a notion of committing an edit - which is what makes it sensitive to
// *when* the typeahead decides a change has happened.
class TypeaheadEditor implements CellEditor<Row> {
  public canEdit() {
    return true;
  }

  public render(
    value: unknown,
    field: NestedKeyOf<Row>,
    row: Row,
    controller: YatlTableController<Row>,
  ) {
    const save = (event: Event) => {
      const target = event.target as YatlTypeahead;
      controller.setPendingValue(row, field, target.value);
    };

    return html`
      <yatl-typeahead
        min-query-length="1"
        .value=${live(String(value))}
        .localData=${['test1', 'test2', 'test3']}
        @change=${save}
      ></yatl-typeahead>
    `;
  }
}

async function renderTable() {
  document.body.innerHTML = '<yatl-table></yatl-table>';
  const el = document.querySelector<YatlTable<Row>>('yatl-table')!;
  el.columns = [
    { field: 'id', title: 'ID' },
    { field: 'status', title: 'Status', editor: new TypeaheadEditor() },
    { field: 'other', title: 'Other', editor: new TypeaheadEditor() },
  ];
  el.data = [
    { id: 1, status: 'one', other: 'x' },
    { id: 2, status: 'two', other: 'y' },
  ];
  el.rowIdCallback = (row: Row) => row.id;
  el.editTrigger = 'click';
  // Batch so nothing is ever committed (and so cleared) behind our back.
  el.commitStrategy = 'batch';
  await el.updateComplete;
  return el;
}

// Opens the editor for Alice's status cell and types into the typeahead.
async function startEditing(table: YatlTable<Row>, text = 'X') {
  const tableLocator = page.elementLocator(table);
  await userEvent.click(tableLocator.getByRole('cell', { name: 'one' }));
  // The table focuses the editor on a timeout after opening it.
  await waitForEditorFocus(table);
  await userEvent.keyboard(text);
  return tableLocator;
}

async function waitForEditorFocus(table: YatlTable<Row>) {
  const deadline = Date.now() + 1000;
  while (Date.now() < deadline) {
    const typeahead =
      table.shadowRoot!.querySelector<YatlTypeahead>('yatl-typeahead');
    if (typeahead?.shadowRoot?.activeElement) {
      return;
    }
    await new Promise(r => setTimeout(r, 10));
  }
  throw new Error('typeahead cell editor never received focus');
}

async function settle(table: YatlTable<Row>) {
  await new Promise(r => setTimeout(r, 50));
  await table.updateComplete;
}

describe('YatlTypeahead as a table cell editor', () => {
  test('Enter saves what was typed', async () => {
    const table = await renderTable();
    await startEditing(table);

    await userEvent.keyboard('{Enter}');
    await settle(table);

    const [alice] = table.data;
    expect(table.controller.getLatestValue(alice, 'status')).toBe('X');
    expect(table.controller.getCellStatus(alice, 'status')).toBe('dirty');
  });

  test('Tab saves what was typed', async () => {
    const table = await renderTable();
    await startEditing(table);

    await userEvent.keyboard('{Tab}');
    await settle(table);

    const [alice] = table.data;
    expect(table.controller.getLatestValue(alice, 'status')).toBe('X');
  });

  test('clicking away saves what was typed', async () => {
    const table = await renderTable();
    const tableLocator = await startEditing(table);

    await userEvent.click(tableLocator.getByRole('cell', { name: '1' }));
    await settle(table);

    const [alice] = table.data;
    expect(table.controller.getLatestValue(alice, 'status')).toBe('X');
  });

  test('Escape discards what was typed', async () => {
    const table = await renderTable();
    await startEditing(table);

    await userEvent.keyboard('{Escape}');
    await settle(table);

    const [alice] = table.data;
    expect(table.controller.getLatestValue(alice, 'status')).toBe('one');
    expect(table.controller.getCellStatus(alice, 'status')).toBe('clean');
  });

  test('clicking a result saves that result, not the text typed to find it', async () => {
    const table = await renderTable();
    await startEditing(table, 'te');

    const typeahead =
      table.shadowRoot!.querySelector<YatlTypeahead>('yatl-typeahead')!;
    await typeahead.updateComplete;
    const [first] = typeahead.shadowRoot!.querySelectorAll('yatl-option');
    await userEvent.click(first);
    await settle(table);

    const [alice] = table.data;
    expect(table.controller.getLatestValue(alice, 'status')).toBe('test1');
  });
});
