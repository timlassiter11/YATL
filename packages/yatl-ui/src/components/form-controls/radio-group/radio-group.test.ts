import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlRadioGroup } from './radio-group';
import { YatlRadio } from '../radio/radio';
import { YatlSwitch } from '../switch/switch';

async function updateAll(...els: { updateComplete: Promise<unknown> }[]) {
  await Promise.all(els.map(el => el.updateComplete));
}

describe('YatlRadioGroup - initial value', () => {
  test('a pre-checked child determines the default value when no value attribute is set', async () => {
    document.body.innerHTML = `
      <yatl-radio-group>
        <yatl-radio value="a"></yatl-radio>
        <yatl-radio value="b" checked></yatl-radio>
        <yatl-radio value="c"></yatl-radio>
      </yatl-radio-group>
    `;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const radios = [...group.querySelectorAll('yatl-radio')] as YatlRadio[];
    await updateAll(group, ...radios);

    expect(group.value).toBe('b');
    expect(radios.map(r => r.checked)).toEqual([false, true, false]);
  });

  test('an explicit value attribute wins over a pre-checked child', async () => {
    document.body.innerHTML = `
      <yatl-radio-group value="c">
        <yatl-radio value="a" checked></yatl-radio>
        <yatl-radio value="c"></yatl-radio>
      </yatl-radio-group>
    `;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const radios = [...group.querySelectorAll('yatl-radio')] as YatlRadio[];
    await updateAll(group, ...radios);

    expect(group.value).toBe('c');
    expect(radios.map(r => r.checked)).toEqual([false, true]);
  });
});

describe('YatlRadioGroup - selection', () => {
  test('checking a radio updates the group value and unchecks siblings', async () => {
    document.body.innerHTML = `
      <yatl-radio-group>
        <yatl-radio value="a" checked></yatl-radio>
        <yatl-radio value="b"></yatl-radio>
      </yatl-radio-group>
    `;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const [a, b] = [...group.querySelectorAll('yatl-radio')] as YatlRadio[];
    await updateAll(group, a, b);

    let changeCount = 0;
    group.addEventListener('change', () => changeCount++);

    const bInput = b.shadowRoot!.querySelector('input')!;
    bInput.checked = true;
    bInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(group.value).toBe('b');
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
    expect(changeCount).toBe(1);
  });

  test('a required group re-checks the last selection if a switch child is unchecked', async () => {
    document.body.innerHTML = `
      <yatl-radio-group required>
        <yatl-switch value="a" checked></yatl-switch>
        <yatl-switch value="b"></yatl-switch>
      </yatl-radio-group>
    `;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const [a] = [...group.querySelectorAll('yatl-switch')] as YatlSwitch[];
    await updateAll(group, a);

    const aInput = a.shadowRoot!.querySelector('input')!;
    aInput.checked = false;
    aInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(group.value).toBe('a');
    expect(a.checked).toBe(true);
  });

  test('a non-required group allows unchecking a switch child down to no selection', async () => {
    document.body.innerHTML = `
      <yatl-radio-group>
        <yatl-switch value="a" checked></yatl-switch>
        <yatl-switch value="b"></yatl-switch>
      </yatl-radio-group>
    `;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const [a] = [...group.querySelectorAll('yatl-switch')] as YatlSwitch[];
    await updateAll(group, a);

    const aInput = a.shadowRoot!.querySelector('input')!;
    aInput.checked = false;
    aInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(group.value).toBe('');
    expect(a.checked).toBe(false);
  });
});

describe('YatlRadioGroup - disabled propagation and reset', () => {
  test('disabling the group disables its children without touching their own disabled property', async () => {
    document.body.innerHTML = `
      <yatl-radio-group>
        <yatl-radio value="a"></yatl-radio>
      </yatl-radio-group>
    `;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const radio = group.querySelector<YatlRadio>('yatl-radio')!;
    await updateAll(group, radio);

    group.disabled = true;
    await updateAll(group, radio);

    expect(radio.isDisabled).toBe(true);
    expect(radio.disabled).toBe(false);
  });

  test('form reset restores the group to its initial default value', async () => {
    document.body.innerHTML = `
      <form>
        <yatl-radio-group>
          <yatl-radio value="a" checked></yatl-radio>
          <yatl-radio value="b"></yatl-radio>
        </yatl-radio-group>
      </form>
    `;
    const form = document.querySelector('form')!;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const [a, b] = [...group.querySelectorAll('yatl-radio')] as YatlRadio[];
    await updateAll(group, a, b);

    const bInput = b.shadowRoot!.querySelector('input')!;
    bInput.checked = true;
    bInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(group.value).toBe('b');

    form.reset();

    expect(group.value).toBe('a');
    expect(a.checked).toBe(true);
    expect(b.checked).toBe(false);
  });

  test("form reset keeps children visually in sync when the default selection came from the group's value attribute, not a pre-checked child", async () => {
    document.body.innerHTML = `
      <form>
        <yatl-radio-group value="b">
          <yatl-radio value="a"></yatl-radio>
          <yatl-radio value="b"></yatl-radio>
        </yatl-radio-group>
      </form>
    `;
    const form = document.querySelector('form')!;
    const group = document.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const [a, b] = [...group.querySelectorAll('yatl-radio')] as YatlRadio[];
    await updateAll(group, a, b);

    expect(group.value).toBe('b');
    expect(b.checked).toBe(true);

    const aInput = a.shadowRoot!.querySelector('input')!;
    aInput.checked = true;
    aInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(group.value).toBe('a');

    form.reset();

    expect(group.value).toBe('b');
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });
});
