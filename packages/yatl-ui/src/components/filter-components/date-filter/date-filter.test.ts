import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

import '../../../index';
import { YatlDateFilter } from './date-filter';

describe('YatlDateFilter', () => {
  test('a typed date applies on Enter, without opening the calendar', async () => {
    document.body.innerHTML =
      '<yatl-date-filter field="date"></yatl-date-filter>';
    const el = document.querySelector<YatlDateFilter>('yatl-date-filter')!;
    await el.updateComplete;

    el.shadowRoot!.querySelector('yatl-date-input')!
      .shadowRoot!.querySelector<HTMLElement>('[part="segment"]')!
      .focus();
    await userEvent.keyboard('03152024{Enter}');
    await el.updateComplete;

    expect(el.value?.getTime()).toBe(new Date(2024, 2, 15).getTime());
  });
});
