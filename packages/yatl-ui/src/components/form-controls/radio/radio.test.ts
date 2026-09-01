import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlRadio } from './radio';

describe('YatlRadio - initial checked state', () => {
  test('an explicit .checked property set before first render is not clobbered by defaultChecked', async () => {
    document.body.innerHTML = '<yatl-radio></yatl-radio>';
    const el = document.querySelector<YatlRadio>('yatl-radio')!;
    el.checked = true;
    await el.updateComplete;

    expect(el.checked).toBe(true);
  });
});

describe('YatlRadio - form behavior', () => {
  test('formValue is the value only while checked', async () => {
    document.body.innerHTML = '<yatl-radio value="a"></yatl-radio>';
    const el = document.querySelector<YatlRadio>('yatl-radio')!;
    await el.updateComplete;

    expect(el.formValue).toBeNull();

    el.checked = true;
    expect(el.formValue).toBe('a');
  });
});
