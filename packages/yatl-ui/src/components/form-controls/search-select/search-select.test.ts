import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

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

// Regression coverage for a bug where selecting a second option was
// impossible: a real mousedown on a (non-focusable) option blurs the
// search input, since nothing else in the component picks up focus
// (delegatesFocus is off). A focusout listener on the input used to react
// to that by collapsing back to the summary/chips view - fine for the
// *first* selection, since renderContents() also shows the list whenever
// there's no selection yet regardless of focus, but as soon as one option
// is selected that fallback stops covering for it: the very next mousedown
// blurs the input, the summary view renders in the option's place, and the
// in-flight click lands on nothing. Removing that focusout listener (the
// document-level pointerdown handler above is the sole authority for "did
// the user actually leave the component") fixed it.
describe('YatlSearchSelect - staying open across multiple selections', () => {
  test('a real click can select a second option after the first', async () => {
    const el = await renderSearchSelect(
      '',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    const input = el.shadowRoot!.querySelector('input')!;
    const [a, b] = [...el.querySelectorAll('yatl-option')] as YatlOption[];

    // Trusted clicks are required here - untrusted clicks (el.click(), or a
    // dispatched MouseEvent) don't trigger the browser's own default focus
    // handling, so they can't exercise the input-blurring behavior this bug
    // depended on.
    await userEvent.click(input);
    await userEvent.click(a);
    await el.updateComplete;
    expect(el.value).toEqual(['a']);

    await userEvent.click(b);
    await el.updateComplete;
    expect(el.value).toEqual(['a', 'b']);
  });

  test("the input blurring with nowhere else to go doesn't collapse the list once something is selected", async () => {
    const el = await renderSearchSelect(
      '',
      `
        <yatl-option value="a" label="A"></yatl-option>
        <yatl-option value="b" label="B"></yatl-option>
      `,
    );
    const input = el.shadowRoot!.querySelector('input')!;
    const [a] = [...el.querySelectorAll('yatl-option')] as YatlOption[];

    await userEvent.click(input);
    await userEvent.click(a);
    await el.updateComplete;
    expect(el.value).toEqual(['a']);

    // Simulate exactly what a real mousedown on a non-focusable option
    // does to the search input: blur it, with nothing else in the
    // component to receive focus (relatedTarget is null).
    input.dispatchEvent(
      new FocusEvent('focusout', { relatedTarget: null, bubbles: true }),
    );
    await el.updateComplete;

    const optionsPanel = el.shadowRoot!.querySelector('[part="options"]')!;
    expect(optionsPanel.querySelector('slot:not([name])')).not.toBeNull();
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
