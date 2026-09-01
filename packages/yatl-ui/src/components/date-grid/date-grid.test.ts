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
