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
