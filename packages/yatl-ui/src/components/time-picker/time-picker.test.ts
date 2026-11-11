import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlTimePicker } from './time-picker';

async function renderPicker(attrs = '') {
  document.body.innerHTML = `<yatl-time-picker ${attrs}></yatl-time-picker>`;
  const el = document.querySelector<YatlTimePicker>('yatl-time-picker')!;
  await el.updateComplete;
  return el;
}

function column(el: YatlTimePicker, key: string) {
  return el.shadowRoot!.querySelector<HTMLElement>(`[data-column="${key}"]`)!;
}

/** The seven visible rows of a column */
function visibleRows(el: YatlTimePicker, key: string) {
  return [...column(el, key).querySelectorAll<HTMLElement>('.row')].filter(
    row => Math.abs(Number(row.dataset.offset)) <= 3,
  );
}

/** The visible rows' text, "" for an empty row */
function labels(el: YatlTimePicker, key: string) {
  return visibleRows(el, key).map(row => row.textContent!.trim());
}

function option(el: YatlTimePicker, key: string, label: string) {
  return visibleRows(el, key).find(row => row.textContent!.trim() === label)!;
}

function selected(el: YatlTimePicker, key: string) {
  return column(el, key).querySelector('.option.selected')?.textContent!.trim();
}

async function press(el: YatlTimePicker, key: string, name: string) {
  column(el, key).dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true }),
  );
  await el.updateComplete;
}

describe('YatlTimePicker - columns', () => {
  test('a long column wraps around, the first option in the middle', async () => {
    const el = await renderPicker('hour-cycle="h23" step="15"');
    expect(labels(el, 'hour')).toEqual([
      '21',
      '22',
      '23',
      '00',
      '01',
      '02',
      '03',
    ]);
    expect(column(el, 'period')).toBeNull();
    // Nothing is selected without a time
    expect(selected(el, 'hour')).toBeUndefined();
  });

  test('a short column does not wrap, so no option shows twice', async () => {
    const el = await renderPicker('hour-cycle="h23" step="15" value="08:15"');
    expect(labels(el, 'minute')).toEqual(['', '', '00', '15', '30', '45', '']);
  });

  test('a 12 hour clock goes 12, 01 ... 11 and has AM/PM', async () => {
    const el = await renderPicker('hour-cycle="h12"');
    expect(labels(el, 'hour')).toEqual([
      '09',
      '10',
      '11',
      '12',
      '01',
      '02',
      '03',
    ]);
    const period = labels(el, 'period');
    expect(period.slice(0, 3)).toEqual(['', '', '']);
    expect(period.filter(Boolean)).toHaveLength(2);
  });

  test('the selected parts sit in the middle', async () => {
    const el = await renderPicker('hour-cycle="h12" value="14:30"');
    expect(selected(el, 'hour')).toBe('02');
    expect(labels(el, 'hour')[3]).toBe('02');
    expect(selected(el, 'minute')).toBe('30');
    expect(labels(el, 'minute')[3]).toBe('30');
    expect(selected(el, 'period')).toMatch(/PM/i);
    expect(labels(el, 'period')[3]).toMatch(/PM/i);
  });
});

describe('YatlTimePicker - picking', () => {
  test('clicking a part sets the time and fires change', async () => {
    const el = await renderPicker('hour-cycle="h12" value="14:30"');
    let changes = 0;
    el.addEventListener('change', () => changes++);

    option(el, 'hour', '05').click();
    await el.updateComplete;
    expect(el.value).toBe('17:30');

    const am = labels(el, 'period').find(Boolean)!;
    option(el, 'period', am).click();
    await el.updateComplete;
    expect(el.value).toBe('05:30');
    expect(changes).toBe(2);

    // Clicking the selected part again changes nothing
    option(el, 'hour', '05').click();
    await el.updateComplete;
    expect(changes).toBe(2);
  });

  test('without a time, the other parts start at their first option', async () => {
    const el = await renderPicker('hour-cycle="h12" step="15"');
    option(el, 'minute', '45').click();
    await el.updateComplete;
    // 12 AM is the first hour and AM the first period
    expect(el.value).toBe('00:45');
  });

  test('hours entirely outside min and max are disabled', async () => {
    let el = await renderPicker('hour-cycle="h23" min="06:00" max="18:30"');
    expect(option(el, 'hour', '05').classList.contains('disabled')).toBe(true);
    expect(option(el, 'hour', '06').classList.contains('disabled')).toBe(false);

    option(el, 'hour', '05').click();
    await el.updateComplete;
    expect(el.value).toBe('');

    el = await renderPicker(
      'hour-cycle="h23" min="06:00" max="18:30" value="17:00"',
    );
    expect(option(el, 'hour', '18').classList.contains('disabled')).toBe(false);
    expect(option(el, 'hour', '19').classList.contains('disabled')).toBe(true);
  });

  test('the arrow buttons pick the previous and next option', async () => {
    const el = await renderPicker('hour-cycle="h23" value="08:15"');
    const [up, down] = column(
      el,
      'hour',
    ).parentElement!.querySelectorAll<HTMLElement>('.scroll-button');
    down.click();
    await el.updateComplete;
    expect(el.value).toBe('09:15');
    up.click();
    up.click();
    await el.updateComplete;
    expect(el.value).toBe('07:15');
  });

  test('the mouse wheel spins a column', async () => {
    const el = await renderPicker('hour-cycle="h23" value="08:15"');
    const wheel = (deltaY: number) =>
      column(el, 'minute').dispatchEvent(
        new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }),
      );
    wheel(100);
    await el.updateComplete;
    expect(el.value).toBe('08:16');
    wheel(-100);
    await el.updateComplete;
    expect(el.value).toBe('08:15');
  });
});

describe('YatlTimePicker - keyboard', () => {
  test('up and down pick the previous and next option', async () => {
    const el = await renderPicker('hour-cycle="h23" value="08:15" step="15"');
    await press(el, 'hour', 'ArrowDown');
    expect(el.value).toBe('09:15');
    await press(el, 'minute', 'ArrowUp');
    expect(el.value).toBe('09:00');
    await press(el, 'minute', 'End');
    expect(el.value).toBe('09:45');
  });

  test('a long column wraps, a short one stops at its end', async () => {
    let el = await renderPicker('hour-cycle="h23" value="23:59"');
    await press(el, 'hour', 'ArrowDown');
    expect(el.value).toBe('00:59');
    // The hour does not carry over, like a native picker
    await press(el, 'minute', 'ArrowDown');
    expect(el.value).toBe('00:00');

    el = await renderPicker('hour-cycle="h23" value="08:45" step="15"');
    await press(el, 'minute', 'ArrowDown');
    expect(el.value).toBe('08:45');
  });

  test('up and down skip disabled hours', async () => {
    const el = await renderPicker(
      'hour-cycle="h23" min="06:00" max="18:00" value="06:00"',
    );
    await press(el, 'hour', 'ArrowUp');
    // Wraps past 05 ... 00 and 23 ... 19 to the last allowed hour
    expect(el.value).toBe('18:00');
  });

  test('left and right move between columns', async () => {
    const el = await renderPicker('hour-cycle="h12" value="14:30"');
    column(el, 'hour').focus();
    await press(el, 'hour', 'ArrowRight');
    expect(el.shadowRoot!.activeElement).toBe(column(el, 'minute'));
    await press(el, 'minute', 'ArrowRight');
    expect(el.shadowRoot!.activeElement).toBe(column(el, 'period'));
  });

  test('Enter fires done', async () => {
    const el = await renderPicker('hour-cycle="h23" value="08:00"');
    let done = 0;
    el.addEventListener('done', () => done++);
    await press(el, 'hour', 'Enter');
    expect(done).toBe(1);
  });

  test('each column is one tab stop, a spin button with its text', async () => {
    const el = await renderPicker('hour-cycle="h23" value="08:15"');
    const hours = column(el, 'hour');
    expect(hours.tabIndex).toBe(0);
    expect(hours.getAttribute('role')).toBe('spinbutton');
    expect(hours.getAttribute('aria-valuetext')).toBe('08');
  });
});
