import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { UnspecifiedRecord, YatlTableController } from '@timlassiter11/yatl';

import '../../../index';
import { YatlTypeahead } from '../../form-controls/typeahead/typeahead';
import { YatlTypeaheadFilter } from './typeahead-filter';

function createController() {
  const controller = new YatlTableController<UnspecifiedRecord>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [{ field: 'id' }, { field: 'name' }];
  controller.data = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Alphabet' },
    { id: 3, name: 'Bravo' },
  ];
  return controller;
}

async function renderFilter() {
  const controller = createController();
  document.body.innerHTML = `
    <yatl-typeahead-filter field="name" min-query-length="1"></yatl-typeahead-filter>
    <button id="elsewhere" style="position: fixed; right: 0; bottom: 0">
      Elsewhere
    </button>
  `;
  const filter = document.querySelector<YatlTypeaheadFilter>(
    'yatl-typeahead-filter',
  )!;
  filter.controller = controller;
  await filter.updateComplete;

  const typeahead =
    filter.shadowRoot!.querySelector<YatlTypeahead>('yatl-typeahead')!;
  await typeahead.updateComplete;
  return { controller, filter, typeahead };
}

describe('YatlTypeaheadFilter', () => {
  // Moving focus from the input to the dropdown with the arrow keys used to
  // make the typeahead report a change, so the table was filtered by
  // whatever half-typed text was in the box the moment the user went to
  // pick a result.
  test('arrowing from the input into the results does not filter the table', async () => {
    const { controller, filter, typeahead } = await renderFilter();

    typeahead.focus();
    await userEvent.keyboard('Al');
    await typeahead.updateComplete;
    await userEvent.keyboard('{ArrowDown}');

    expect(typeahead.shadowRoot!.activeElement?.tagName).toBe('YATL-OPTION');
    expect(filter.value).toBeUndefined();
    expect(controller.filters?.name).toBeUndefined();
  });

  test('picking a result filters the table by it', async () => {
    const { controller, filter, typeahead } = await renderFilter();

    typeahead.focus();
    await userEvent.keyboard('Al');
    await typeahead.updateComplete;
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(filter.value).toMatch(/^Alpha/);
    expect(controller.filters?.name).toBe(filter.value);
  });

  test('leaving the box filters the table by what was typed', async () => {
    const { controller, filter, typeahead } = await renderFilter();

    typeahead.focus();
    await userEvent.keyboard('Bravo');
    await userEvent.click(document.querySelector('#elsewhere')!);

    expect(filter.value).toBe('Bravo');
    expect(controller.filters?.name).toBe('Bravo');
  });

  test('clearing the box and leaving removes the filter again', async () => {
    const { controller, filter, typeahead } = await renderFilter();

    typeahead.focus();
    await userEvent.keyboard('Bravo');
    await userEvent.click(document.querySelector('#elsewhere')!);
    expect(filter.value).toBe('Bravo');

    typeahead.focus();
    await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
    await userEvent.click(document.querySelector('#elsewhere')!);

    expect(filter.value).toBeUndefined();
    expect(controller.filters?.name).toBeUndefined();
  });
});
