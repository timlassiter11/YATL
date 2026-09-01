import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlSelect } from './select';
import { YatlOption } from '../../option/option';

async function renderSelect(attrs: string, optionsHtml: string) {
  document.body.innerHTML = `<yatl-select ${attrs}>${optionsHtml}</yatl-select>`;
  const el = document.querySelector<YatlSelect>('yatl-select')!;
  await el.updateComplete;
  return el;
}

describe('YatlSelect - single select', () => {
  test('setting value selects the matching option', async () => {
    const el = await renderSelect(
      '',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    el.value = 'b';
    await el.updateComplete;

    const options = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    expect(options.map(o => o.checked)).toEqual([false, true]);
  });

  test('clicking an option updates value and emits change', async () => {
    const el = await renderSelect(
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

    expect(el.value).toBe('b');
    expect(changeCount).toBe(1);
  });

  test('clicking a second option in single mode replaces the first, not adds to it', async () => {
    const el = await renderSelect(
      '',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    const [a, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    expect(el.value).toBe('a');

    b.click();
    expect(el.value).toBe('b');
    expect(a.checked).toBe(false);
  });
});

describe('YatlSelect - multi select', () => {
  test('multiple selections accumulate and formValue includes each', async () => {
    document.body.innerHTML = `
      <form>
        <yatl-select multi name="tags">
          <yatl-option value="a" label="A"></yatl-option>
          <yatl-option value="b" label="B"></yatl-option>
          <yatl-option value="c" label="C"></yatl-option>
        </yatl-select>
      </form>
    `;
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlSelect>('yatl-select')!;
    await el.updateComplete;

    const [a, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    b.click();

    expect(el.value).toEqual(['a', 'b']);
    expect(new FormData(form).getAll('tags')).toEqual(['a', 'b']);
  });

  test('clicking a checked option in multi mode unchecks it', async () => {
    const el = await renderSelect(
      'multi',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    const [a, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    b.click();
    expect(el.value).toEqual(['a', 'b']);

    a.click();
    expect(el.value).toEqual(['b']);
  });

  test('required does not prevent unchecking one option while another stays selected', async () => {
    const el = await renderSelect(
      'multi required',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    const [a, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    b.click();
    expect(el.value).toEqual(['a', 'b']);

    a.click();

    expect(el.value).toEqual(['b']);
    expect(a.checked).toBe(false);
  });

  test('required does prevent unchecking the only selected option', async () => {
    const el = await renderSelect(
      'multi required',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    const [a] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    expect(el.value).toEqual(['a']);

    a.click();

    expect(el.value).toEqual(['a']);
    expect(a.checked).toBe(true);
  });
});

describe('YatlSelect - required validity', () => {
  test('an empty multi-select is invalid when required', async () => {
    const el = await renderSelect(
      'multi required',
      `<yatl-option value="a" label="A"></yatl-option>`,
    );

    expect(el.checkValidity()).toBe(false);
  });

  test('becomes valid once an option is selected', async () => {
    const el = await renderSelect(
      'multi required',
      `<yatl-option value="a" label="A"></yatl-option>`,
    );
    expect(el.checkValidity()).toBe(false);

    const [a] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();

    expect(el.checkValidity()).toBe(true);
  });
});

describe('YatlSelect - clearable', () => {
  test('the clear button resets the value', async () => {
    const el = await renderSelect(
      'clearable',
      `
        <yatl-option value="a" label="A"></yatl-option>
      `,
    );
    const [a] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
    a.click();
    await el.updateComplete;
    expect(el.value).toBe('a');

    const clearButton = el.shadowRoot!.querySelector(
      '.clear-button',
    ) as HTMLElement;
    clearButton.click();

    expect(el.value).toBe('');
  });
});

describe('YatlSelect - disabled/readonly', () => {
  test('disabled prevents the trigger from opening the dropdown', async () => {
    const el = await renderSelect(
      'disabled',
      `<yatl-option value="a" label="A"></yatl-option>`,
    );

    const trigger = el.shadowRoot!.querySelector('.text-input') as HTMLElement;
    trigger.click();
    await el.updateComplete;

    expect(el.open).toBe(false);
  });
});
