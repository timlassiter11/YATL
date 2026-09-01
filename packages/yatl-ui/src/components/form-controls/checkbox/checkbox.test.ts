import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlCheckbox } from './checkbox';

describe('YatlCheckbox - initial checked state', () => {
  test('an explicit .checked property set before first render is not clobbered by defaultChecked', async () => {
    document.body.innerHTML = '<yatl-checkbox></yatl-checkbox>';
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    // Set as a property (not the checked attribute), simulating a Lit
    // `.checked=${true}` binding from a parent template - this happens
    // before the element's own first update/render.
    el.checked = true;

    await el.updateComplete;

    expect(el.checked).toBe(true);
  });

  test('the checked attribute alone still works as expected', async () => {
    document.body.innerHTML = '<yatl-checkbox checked></yatl-checkbox>';
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    await el.updateComplete;

    expect(el.checked).toBe(true);
  });

  test('an explicit .defaultChecked property (no checked override) is honored', async () => {
    document.body.innerHTML = '<yatl-checkbox></yatl-checkbox>';
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    el.defaultChecked = true;

    await el.updateComplete;

    expect(el.checked).toBe(true);
  });
});

describe('YatlCheckbox - interaction and form behavior', () => {
  test('clicking the native input toggles checked and emits change', async () => {
    document.body.innerHTML = '<yatl-checkbox></yatl-checkbox>';
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    await el.updateComplete;

    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    const input = el.shadowRoot!.querySelector('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(el.checked).toBe(true);
    expect(changeCount).toBe(1);
  });

  test('formValue reflects value only while checked', async () => {
    document.body.innerHTML = '<yatl-checkbox value="fruit"></yatl-checkbox>';
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    await el.updateComplete;

    expect(el.formValue).toBeNull();

    el.checked = true;
    expect(el.formValue).toBe('fruit');
  });

  test('form reset restores defaultChecked, not just the last checked state', async () => {
    document.body.innerHTML =
      '<form><yatl-checkbox checked></yatl-checkbox></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    await el.updateComplete;

    el.checked = false;
    expect(el.checked).toBe(false);

    form.reset();

    expect(el.checked).toBe(true);
  });

  test('disabled prevents the value from being submitted', async () => {
    document.body.innerHTML =
      '<form><yatl-checkbox checked name="agree" disabled></yatl-checkbox></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    await el.updateComplete;

    const data = new FormData(form);
    expect(data.get('agree')).toBeNull();
  });
});
