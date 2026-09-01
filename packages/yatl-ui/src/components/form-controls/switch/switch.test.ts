import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlSwitch } from './switch';

describe('YatlSwitch - initial checked state', () => {
  test('an explicit .checked property set before first render is not clobbered by defaultChecked', async () => {
    document.body.innerHTML = '<yatl-switch></yatl-switch>';
    const el = document.querySelector<YatlSwitch>('yatl-switch')!;
    el.checked = true;
    await el.updateComplete;

    expect(el.checked).toBe(true);
  });
});

describe('YatlSwitch - alwaysInclude/uncheckedValue', () => {
  test('formValue is null when unchecked and alwaysInclude is not set', async () => {
    document.body.innerHTML = '<yatl-switch></yatl-switch>';
    const el = document.querySelector<YatlSwitch>('yatl-switch')!;
    await el.updateComplete;

    expect(el.formValue).toBeNull();
  });

  test('formValue falls back to "off" when alwaysInclude is set with no uncheckedValue', async () => {
    document.body.innerHTML = '<yatl-switch always-include></yatl-switch>';
    const el = document.querySelector<YatlSwitch>('yatl-switch')!;
    await el.updateComplete;

    expect(el.formValue).toBe('off');
  });

  test('formValue uses uncheckedValue when unchecked and alwaysInclude is set', async () => {
    document.body.innerHTML =
      '<yatl-switch always-include unchecked-value="no"></yatl-switch>';
    const el = document.querySelector<YatlSwitch>('yatl-switch')!;
    await el.updateComplete;

    expect(el.formValue).toBe('no');

    el.checked = true;
    expect(el.formValue).toBe('on');
  });

  test('a form only submits the switch value while checked, by default', async () => {
    document.body.innerHTML =
      '<form><yatl-switch name="notify" value="yes"></yatl-switch></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlSwitch>('yatl-switch')!;
    await el.updateComplete;

    expect(new FormData(form).get('notify')).toBeNull();

    el.checked = true;
    expect(new FormData(form).get('notify')).toBe('yes');
  });
});
