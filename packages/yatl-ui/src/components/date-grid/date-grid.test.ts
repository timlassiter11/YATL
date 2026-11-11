import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDateGrid } from './date-grid';
import { YatlDateSelected } from '../../events';

async function renderGrid() {
  document.body.innerHTML = '<yatl-date-grid></yatl-date-grid>';
  const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
  await el.updateComplete;
  return el;
}

const monthYearFormatter = Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
});

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function monthLabel(el: YatlDateGrid) {
  return el
    .shadowRoot!.querySelector('[part~="month-button"]')!
    .textContent!.trim();
}

async function clickButton(el: YatlDateGrid, part: string) {
  const button = el.shadowRoot!.querySelector(
    `[part~="${part}"]`,
  ) as HTMLElement;
  button.click();
  await el.updateComplete;
}

function weekRows(el: YatlDateGrid) {
  // Index 0 is the weekday-abbreviation header row (renders through the
  // same [part="week"] wrapper) - actual calendar weeks start at index 1.
  return [...el.shadowRoot!.querySelectorAll('[part="week"]')].slice(1);
}

// The first calendar week row contains any leading days from the previous
// month, if the 1st doesn't fall on a Sunday. Nearly every month has
// these, but not all (e.g. if the 1st is a Sunday) - so search forward a
// few months for one that reliably does, keeping the test independent of
// today's date.
async function findLeadingPreviousMonthDay(el: YatlDateGrid) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const firstWeekRow = weekRows(el)[0];
    const outsideMonthButtons = [
      ...firstWeekRow.querySelectorAll('yatl-button.is-outside-month'),
    ];
    if (outsideMonthButtons.length > 0) {
      return outsideMonthButtons.at(-1) as HTMLElement;
    }
    await clickButton(el, 'next-button');
  }
  throw new Error('Could not find a leading previous-month day to test');
}

describe('YatlDateGrid - navigation', () => {
  test('Next/Previous month buttons update the displayed month', async () => {
    const el = await renderGrid();
    const initialLabel = monthLabel(el);

    await clickButton(el, 'next-button');
    expect(monthLabel(el)).not.toBe(initialLabel);

    await clickButton(el, 'previous-button');
    expect(monthLabel(el)).toBe(initialLabel);
  });

  test('clicking a trailing next-month day navigates the grid forward', async () => {
    const el = await renderGrid();
    const initialLabel = monthLabel(el);

    const lastWeekRow = weekRows(el).at(-1)!;
    const nextMonthButton = lastWeekRow.querySelector(
      'yatl-button.is-outside-month',
    ) as HTMLElement;
    nextMonthButton.click();
    await el.updateComplete;

    expect(monthLabel(el)).not.toBe(initialLabel);
  });

  test('clicking a leading previous-month day navigates the grid backward', async () => {
    const el = await renderGrid();
    const dayButton = await findLeadingPreviousMonthDay(el);
    const labelBeforeClick = monthLabel(el);

    dayButton.click();
    await el.updateComplete;

    expect(monthLabel(el)).not.toBe(labelBeforeClick);
  });
});

describe('YatlDateGrid - selection', () => {
  test('clicking a day fires yatl-date-selected with that date', async () => {
    const el = await renderGrid();
    let selected: Date | undefined;
    el.addEventListener('yatl-date-selected', (e: YatlDateSelected) => {
      selected = e.date;
    });

    const firstDayButton = el.shadowRoot!.querySelector(
      'yatl-button.day-button:not(.is-outside-month)',
    ) as HTMLElement;
    firstDayButton.click();

    expect(selected).toBeInstanceOf(Date);
  });
});

describe('YatlDateGrid - relevant initial month', () => {
  test('defaults to the current month when there is no min/max', async () => {
    const el = await renderGrid();
    expect(monthLabel(el)).toBe(monthYearFormatter.format(new Date()));
  });

  test('defaults to the current month when today falls within min/max', async () => {
    document.body.innerHTML = '<yatl-date-grid></yatl-date-grid>';
    const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
    el.min = addMonths(new Date(), -6);
    el.max = addMonths(new Date(), 6);
    await el.updateComplete;

    expect(monthLabel(el)).toBe(monthYearFormatter.format(new Date()));
  });

  test('opens on the min month when the whole range is in the future', async () => {
    document.body.innerHTML = '<yatl-date-grid></yatl-date-grid>';
    const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
    const min = addMonths(new Date(), 8);
    el.min = min;
    el.max = addMonths(new Date(), 10);
    await el.updateComplete;

    expect(monthLabel(el)).toBe(monthYearFormatter.format(min));
  });

  test('opens on the max month when the whole range is in the past', async () => {
    document.body.innerHTML = '<yatl-date-grid></yatl-date-grid>';
    const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
    el.min = addMonths(new Date(), -10);
    const max = addMonths(new Date(), -8);
    el.max = max;
    await el.updateComplete;

    expect(monthLabel(el)).toBe(monthYearFormatter.format(max));
  });

  test('opens on an existing selection instead of today, even far away', async () => {
    document.body.innerHTML = '<yatl-date-grid></yatl-date-grid>';
    const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
    const selected = addMonths(new Date(), -14);
    el.ranges = [{ start: selected, end: selected, color: 'brand' }];
    await el.updateComplete;

    expect(monthLabel(el)).toBe(monthYearFormatter.format(selected));
  });

  test('does not yank the view back after the user navigates away with an unchanged selection', async () => {
    const el = await renderGrid();
    el.ranges = [{ start: new Date(), end: undefined, color: 'brand' }];
    await el.updateComplete;
    const selectionLabel = monthLabel(el);

    await clickButton(el, 'next-button');
    await clickButton(el, 'next-button');
    const labelAfterNavigating = monthLabel(el);
    // Confirm navigation actually moved the view - otherwise the
    // stability check below would trivially pass even if navigation were
    // completely broken.
    expect(labelAfterNavigating).not.toBe(selectionLabel);

    // Re-render with the exact same ranges/min/max, as would happen from
    // an unrelated prop update (e.g. `disabled` toggling) elsewhere.
    el.requestUpdate();
    await el.updateComplete;

    expect(monthLabel(el)).toBe(labelAfterNavigating);
  });

  test('re-picks a relevant month once a selection is cleared', async () => {
    document.body.innerHTML = '<yatl-date-grid></yatl-date-grid>';
    const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
    const selected = addMonths(new Date(), -14);
    el.ranges = [{ start: selected, end: selected, color: 'brand' }];
    await el.updateComplete;
    expect(monthLabel(el)).toBe(monthYearFormatter.format(selected));

    el.ranges = [];
    await el.updateComplete;

    expect(monthLabel(el)).toBe(monthYearFormatter.format(new Date()));
  });
});

/** A grid showing `date`'s month, with `date` selected */
async function renderGridAt(date: Date, attrs = '') {
  document.body.innerHTML = `<yatl-date-grid ${attrs}></yatl-date-grid>`;
  const el = document.querySelector<YatlDateGrid>('yatl-date-grid')!;
  el.ranges = [{ start: date, end: date, color: 'brand' }];
  await el.updateComplete;
  return el;
}

function dayHost(el: YatlDateGrid, date: Date) {
  return el.shadowRoot!.querySelector<HTMLElement>(
    `[data-date="${new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime()}"]`,
  )!;
}

/** The date of the day whose button has keyboard focus */
function focusedDay(el: YatlDateGrid) {
  const host = el.shadowRoot!.activeElement as HTMLElement | null;
  return host?.dataset.date ? new Date(Number(host.dataset.date)) : undefined;
}

async function pressOnCalendar(
  el: YatlDateGrid,
  key: string,
  shiftKey = false,
) {
  const calendar = el.shadowRoot!.querySelector('[part="calendar"]')!;
  calendar.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }),
  );
  await el.updateComplete;
  // Focus moves after the update the key caused
  await new Promise(r => setTimeout(r));
}

describe('YatlDateGrid - keyboard', () => {
  test('only one day is in the tab order: the selected one', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    const days = [
      ...el.shadowRoot!.querySelectorAll<HTMLElement>('[part="day-button"]'),
    ];
    const tabbable = days.filter(d => !d.hasAttribute('tabindex'));
    expect(tabbable).toEqual([dayHost(el, new Date(2026, 10, 11))]);
  });

  test('arrow keys move by a day or a week, into the next month', async () => {
    const el = await renderGridAt(new Date(2026, 10, 27));
    await el.focusCalendar();
    expect(focusedDay(el)?.getDate()).toBe(27);

    await pressOnCalendar(el, 'ArrowRight');
    expect(focusedDay(el)?.getDate()).toBe(28);
    await pressOnCalendar(el, 'ArrowDown');
    // Nov 28 + 7 is Dec 5, so the grid moves to December
    expect(focusedDay(el)?.toDateString()).toBe(
      new Date(2026, 11, 5).toDateString(),
    );
    expect(monthLabel(el)).toBe(
      monthYearFormatter.format(new Date(2026, 11, 1)),
    );
    await pressOnCalendar(el, 'ArrowUp');
    await pressOnCalendar(el, 'ArrowLeft');
    expect(focusedDay(el)?.toDateString()).toBe(
      new Date(2026, 10, 27).toDateString(),
    );
  });

  test('Home and End go to the start and end of the week', async () => {
    // Wednesday
    const el = await renderGridAt(new Date(2026, 10, 11));
    await el.focusCalendar();
    await pressOnCalendar(el, 'Home');
    expect(focusedDay(el)?.getDay()).toBe(0);
    await pressOnCalendar(el, 'End');
    expect(focusedDay(el)?.getDay()).toBe(6);
  });

  test('Page Up/Down change the month, with Shift the year', async () => {
    const el = await renderGridAt(new Date(2026, 0, 31));
    await el.focusCalendar();
    await pressOnCalendar(el, 'PageDown');
    // February has no 31st, so it lands on the last day
    expect(focusedDay(el)?.toDateString()).toBe(
      new Date(2026, 1, 28).toDateString(),
    );
    await pressOnCalendar(el, 'PageUp', true);
    expect(focusedDay(el)?.toDateString()).toBe(
      new Date(2025, 1, 28).toDateString(),
    );
  });

  test('focus stays within min', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11), 'min="2026-11-11"');
    await el.focusCalendar();
    await pressOnCalendar(el, 'ArrowLeft');
    expect(focusedDay(el)?.getDate()).toBe(11);
  });

  test('days have full date labels, and today is marked', async () => {
    const el = await renderGrid();
    const today = new Date();
    const host = dayHost(el, today);
    expect(host.getAttribute('aria-current')).toBe('date');
    expect(host.getAttribute('aria-label')).toContain(
      String(today.getFullYear()),
    );
  });

  test('the selected day is marked selected', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    const cell = dayHost(el, new Date(2026, 10, 11)).parentElement!;
    expect(cell.getAttribute('aria-selected')).toBe('true');
  });
});

/** The view that isn't hidden: days, months or years */
function activeView(el: YatlDateGrid) {
  return el.shadowRoot!.querySelector<HTMLElement>('.view:not([inert])')
    ?.dataset.view;
}

describe('YatlDateGrid - month and year views', () => {
  test('the calendar keeps its size when switching views', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    const size = () => {
      const rect = el.getBoundingClientRect();
      return [Math.round(rect.width), Math.round(rect.height)];
    };
    const days = size();
    await clickButton(el, 'month-button');
    expect(activeView(el)).toBe('months');
    expect(size()).toEqual(days);
    await clickButton(el, 'month-button');
    expect(activeView(el)).toBe('years');
    expect(size()).toEqual(days);
  });

  test('hidden views are inert, so their buttons are out of reach', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    const months = el.shadowRoot!.querySelector<HTMLElement>(
      '[data-view="months"]',
    )!;
    expect(months.inert).toBe(true);
    await clickButton(el, 'month-button');
    expect(months.inert).toBe(false);
  });

  test('clicking the month shows months, and picking one shows its days', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    await clickButton(el, 'month-button');
    expect(monthLabel(el)).toBe('2026');
    const months = [
      ...el.shadowRoot!.querySelectorAll<HTMLElement>('[part~="month-option"]'),
    ];
    expect(months).toHaveLength(12);

    months[2].click();
    await el.updateComplete;
    expect(monthLabel(el)).toBe(
      monthYearFormatter.format(new Date(2026, 2, 1)),
    );
    expect(activeView(el)).toBe('days');
  });

  test('clicking the year shows years, and picking one goes back to months', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    await clickButton(el, 'month-button');
    await clickButton(el, 'month-button');
    const years = [
      ...el.shadowRoot!.querySelectorAll<HTMLElement>('[part~="year-option"]'),
    ];
    expect(years.map(y => y.textContent!.trim())).toContain('2026');

    years.find(y => y.textContent!.trim() === '2030')!.click();
    await el.updateComplete;
    expect(monthLabel(el)).toBe('2030');
  });

  test('the arrows page by year in the month view', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    await clickButton(el, 'month-button');
    await clickButton(el, 'next-button');
    expect(monthLabel(el)).toBe('2027');
  });

  test('months and years outside min and max are disabled', async () => {
    const el = await renderGridAt(
      new Date(2026, 5, 15),
      'min="2026-03-15" max="2026-08-01"',
    );
    await clickButton(el, 'month-button');
    const months = [
      ...el.shadowRoot!.querySelectorAll<
        HTMLButtonElement & { disabled: boolean }
      >('[part~="month-option"]'),
    ];
    // Feb is before min, March (min is in it) through August are allowed
    expect(months.map(m => m.disabled)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  test('Escape goes back to the days', async () => {
    const el = await renderGridAt(new Date(2026, 10, 11));
    await clickButton(el, 'month-button');
    el.shadowRoot!.querySelector('[part="base"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await el.updateComplete;
    expect(activeView(el)).toBe('days');
  });
});
