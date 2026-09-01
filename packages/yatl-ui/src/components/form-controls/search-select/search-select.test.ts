import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlSearchSelect } from './search-select';
import { YatlOption } from '../../option/option';

async function renderSearchSelect(attrs: string, optionsHtml: string) {
  document.body.innerHTML = `<yatl-search-select ${attrs}>${optionsHtml}</yatl-search-select>`;
  const el = document.querySelector<YatlSearchSelect>('yatl-search-select')!;
  await el.updateComplete;
  return el;
}

describe('YatlSearchSelect - selection', () => {
  test('clicking an option selects it and emits change', async () => {
    const el = await renderSearchSelect(
      '',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );

    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    const [, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    b.click();

    expect(el.value).toEqual(['b']);
    expect(changeCount).toBe(1);
  });

  test('formValue includes every selected value', async () => {
    document.body.innerHTML = `
      <form>
        <yatl-search-select name="tags">
          <yatl-option value="a" label="A"></yatl-option>
          <yatl-option value="b" label="B"></yatl-option>
        </yatl-search-select>
      </form>
    `;
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlSearchSelect>('yatl-search-select')!;
    await el.updateComplete;

    const [a, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    b.click();

    expect(new FormData(form).getAll('tags')).toEqual(['a', 'b']);
  });
});

describe('YatlSearchSelect - required validity', () => {
  test('an empty selection is invalid when required', async () => {
    const el = await renderSearchSelect(
      'required',
      `<yatl-option value="a" label="A"></yatl-option>`,
    );

    expect(el.checkValidity()).toBe(false);
  });

  test('becomes valid once something is selected', async () => {
    const el = await renderSearchSelect(
      'required',
      `<yatl-option value="a" label="A"></yatl-option>`,
    );
    expect(el.checkValidity()).toBe(false);

    const [a] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();

    expect(el.checkValidity()).toBe(true);
  });
});
