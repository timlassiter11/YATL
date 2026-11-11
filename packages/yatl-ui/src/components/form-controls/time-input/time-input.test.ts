import { describe, expect, test } from 'vitest';

import '../../../index';
import type { YatlOption } from '../../option/option';
import { YatlTimeInput } from './time-input';

async function renderTime(attrs = '') {
  document.body.innerHTML = `<yatl-time-input ${attrs}></yatl-time-input>`;
  const el = document.querySelector<YatlTimeInput>('yatl-time-input')!;
  await el.updateComplete;
  return el;
}

function segments(el: YatlTimeInput) {
  return [...el.shadowRoot!.querySelectorAll<HTMLElement>('[part="segment"]')];
}

function segmentTexts(el: YatlTimeInput) {
  return segments(el).map(s => s.textContent!.trim());
}

/** Presses keys on whichever segment has focus */
async function press(el: YatlTimeInput, ...keys: string[]) {
  for (const key of keys) {
    const target = el.shadowRoot!.activeElement as HTMLElement;
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
    );
    await el.updateComplete;
  }
}

describe('YatlTimeInput - 24 hour', () => {
  test('a value attribute fills the segments', async () => {
    const el = await renderTime('hour-cycle="h23" value="06:30"');
    expect(el.value).toBe('06:30');
    expect(segmentTexts(el)).toEqual(['06', '30']);
    expect(el.formValue).toBe('06:30');
  });

  test('typing fills each segment in turn and sets the value', async () => {
    const el = await renderTime('hour-cycle="h23"');
    let inputs = 0;
    el.addEventListener('input', () => inputs++);

    segments(el)[0].focus();
    await press(el, '1', '4');
    // Two digits fill the hour, so the minute has focus now
    expect(el.shadowRoot!.activeElement).toBe(segments(el)[1]);
    expect(el.value).toBe('');

    await press(el, '0', '5');
    expect(el.value).toBe('14:05');
    expect(segmentTexts(el)).toEqual(['14', '05']);
    expect(inputs).toBe(4);
  });

  test('a digit that can only start one value moves on right away', async () => {
    const el = await renderTime('hour-cycle="h23"');
    segments(el)[0].focus();
    // No hour is 30-something, so 3 is the whole hour
    await press(el, '3');
    expect(el.shadowRoot!.activeElement).toBe(segments(el)[1]);
    expect(segmentTexts(el)[0]).toBe('03');
  });

  test('a partly filled time has no value and reports badInput', async () => {
    const el = await renderTime('hour-cycle="h23"');
    segments(el)[0].focus();
    await press(el, '1', '4');
    expect(el.value).toBe('');
    expect(el.checkValidity()).toBe(false);
    expect(el.validity.badInput).toBe(true);
  });

  test('change fires once when focus leaves with a new value', async () => {
    document.body.innerHTML = `
      <yatl-time-input hour-cycle="h23"></yatl-time-input>
      <button id="after">after</button>`;
    const el = document.querySelector<YatlTimeInput>('yatl-time-input')!;
    await el.updateComplete;
    let changes = 0;
    el.addEventListener('change', () => changes++);

    segments(el)[0].focus();
    await press(el, '0', '9', '1', '5');
    expect(changes).toBe(0);
    document.getElementById('after')!.focus();
    await el.updateComplete;
    expect(changes).toBe(1);

    // Leaving again without changing anything doesn't fire
    segments(el)[0].focus();
    document.getElementById('after')!.focus();
    expect(changes).toBe(1);
  });

  test('arrow keys step and wrap, using the minute step', async () => {
    const el = await renderTime('hour-cycle="h23" value="23:07" step="15"');
    segments(el)[1].focus();
    await press(el, 'ArrowUp');
    expect(el.value).toBe('23:15');
    await press(el, 'ArrowUp', 'ArrowUp', 'ArrowUp');
    // 15, 30, 45, then wraps to 00
    expect(el.value).toBe('23:00');
    await press(el, 'ArrowDown');
    expect(el.value).toBe('23:45');

    segments(el)[0].focus();
    await press(el, 'ArrowUp');
    expect(el.value).toBe('00:45');
  });

  test('Backspace clears the segment and the value', async () => {
    const el = await renderTime('hour-cycle="h23" value="06:30"');
    segments(el)[1].focus();
    await press(el, 'Backspace');
    expect(segmentTexts(el)).toEqual(['06', '--']);
    expect(el.value).toBe('');
  });

  test('the separator key moves to the next segment', async () => {
    const el = await renderTime('hour-cycle="h23"');
    segments(el)[0].focus();
    await press(el, '1', ':');
    expect(el.shadowRoot!.activeElement).toBe(segments(el)[1]);
    await press(el, '0', '0');
    expect(el.value).toBe('01:00');
  });
});

describe('YatlTimeInput - 12 hour', () => {
  test('shows the hour on a 12 hour clock with AM/PM', async () => {
    const el = await renderTime('hour-cycle="h12" value="14:30"');
    expect(segments(el)).toHaveLength(3);
    const [hour, minute, period] = segmentTexts(el);
    expect([hour, minute]).toEqual(['02', '30']);
    expect(period).toMatch(/PM/i);
  });

  test('typing the hour, minute and a or p sets a 24 hour value', async () => {
    const el = await renderTime('hour-cycle="h12"');
    segments(el)[0].focus();
    await press(el, '2', '3', '0', 'p');
    expect(el.value).toBe('14:30');

    segments(el)[2].focus();
    await press(el, 'a');
    expect(el.value).toBe('02:30');
  });

  test('12 AM is midnight and 12 PM is noon', async () => {
    const el = await renderTime('hour-cycle="h12" value="00:15"');
    expect(segmentTexts(el)[0]).toBe('12');
    el.value = '12:15';
    await el.updateComplete;
    expect(segmentTexts(el)[0]).toBe('12');
    expect(segmentTexts(el)[2]).toMatch(/PM/i);
  });
});

describe('YatlTimeInput - validity', () => {
  test('min, max and step', async () => {
    const el = await renderTime(
      'hour-cycle="h23" min="06:00" max="18:00" step="15"',
    );
    el.value = '05:45';
    await el.updateComplete;
    expect(el.validity.rangeUnderflow).toBe(true);

    el.value = '18:15';
    await el.updateComplete;
    expect(el.validity.rangeOverflow).toBe(true);

    el.value = '06:10';
    await el.updateComplete;
    expect(el.validity.stepMismatch).toBe(true);

    el.value = '06:15';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
  });

  test('required is invalid until a time is set', async () => {
    const el = await renderTime('hour-cycle="h23" required');
    expect(el.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    el.value = '08:00';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
  });
});

describe('YatlTimeInput - value from code and forms', () => {
  test('setting value from code updates the segments', async () => {
    const el = await renderTime('hour-cycle="h23"');
    el.value = '17:45';
    await el.updateComplete;
    expect(segmentTexts(el)).toEqual(['17', '45']);
    el.value = '';
    await el.updateComplete;
    expect(segmentTexts(el)).toEqual(['--', '--']);
  });

  test('form reset restores the default, even mid-edit', async () => {
    document.body.innerHTML = `<form>
      <yatl-time-input name="at" hour-cycle="h23" value="06:00"></yatl-time-input>
    </form>`;
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlTimeInput>('yatl-time-input')!;
    await el.updateComplete;

    segments(el)[1].focus();
    await press(el, 'Backspace');
    expect(new FormData(form).get('at')).toBeNull();

    form.reset();
    await el.updateComplete;
    expect(el.value).toBe('06:00');
    expect(segmentTexts(el)).toEqual(['06', '00']);
    expect(new FormData(form).get('at')).toBe('06:00');
  });

  test('read-only ignores typing', async () => {
    const el = await renderTime('hour-cycle="h23" value="06:00" readonly');
    const [hour] = segments(el);
    expect(hour.tabIndex).toBe(-1);
    hour.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await el.updateComplete;
    expect(el.value).toBe('06:00');
  });

  test('the placeholder shows while empty and unfocused', async () => {
    const el = await renderTime('hour-cycle="h23" placeholder="Any time"');
    const input = el.shadowRoot!.querySelector('#input')!;
    expect(input.textContent!.trim()).toBe('Any time');
    expect(segments(el)).toHaveLength(0);
  });
});

describe('YatlTimeInput - pick list', () => {
  test('lists times every list step between min and max and picks one', async () => {
    const el = await renderTime(
      'hour-cycle="h23" min="08:00" max="10:00" list-step="30"',
    );
    let changes = 0;
    el.addEventListener('change', () => changes++);

    const button = el.shadowRoot!.querySelector<HTMLElement>('.list-button')!;
    button.click();
    const dropdown = el.shadowRoot!.querySelector('yatl-dropdown')!;
    await dropdown.updateComplete;
    await el.updateComplete;
    expect(dropdown.open).toBe(true);

    const options = [
      ...el.shadowRoot!.querySelectorAll<YatlOption>('yatl-option'),
    ];
    expect(options.map(o => o.value)).toEqual([
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
    ]);

    options[2].click();
    await el.updateComplete;
    expect(el.value).toBe('09:00');
    expect(segmentTexts(el)).toEqual(['09', '00']);
    expect(changes).toBe(1);
  });

  test('no-list hides the list button', async () => {
    const el = await renderTime('no-list');
    expect(el.shadowRoot!.querySelector('.list-button')).toBeNull();
  });
});
