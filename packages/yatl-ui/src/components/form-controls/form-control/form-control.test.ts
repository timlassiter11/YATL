import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlCheckbox } from '../checkbox/checkbox';
import { YatlInput } from '../input/input';
import { YatlDateRangeInput } from '../date-range-input/date-range-input';

// Regression coverage for a race condition in the shared
// YatlFormControl.emitInteraction(): it used to dispatch the
// change/input event synchronously, then let Lit's own updated()
// lifecycle commit the new value to ElementInternals on a *later*
// microtask. A `change` listener on an enclosing <form> - which runs
// synchronously, since the dispatched event bubbles - would read
// FormData before that commit happened, seeing the *previous*
// interaction's value (or nothing at all, on the very first one).

describe('YatlFormControl - synchronous form value commit on interaction', () => {
  test('a form-level change listener sees the new value immediately (checkbox)', async () => {
    document.body.innerHTML =
      '<form><yatl-checkbox name="agree" value="yes"></yatl-checkbox></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlCheckbox>('yatl-checkbox')!;
    await el.updateComplete;

    let seenDuringEvent: string | null = null;
    form.addEventListener('change', () => {
      seenDuringEvent = new FormData(form).get('agree') as string | null;
    });

    const input = el.shadowRoot!.querySelector('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(seenDuringEvent).toBe('yes');
  });

  test('a form-level change listener sees the new value immediately (plain text input)', async () => {
    document.body.innerHTML =
      '<form><yatl-input name="username"></yatl-input></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlInput>('yatl-input')!;
    await el.updateComplete;

    let seenDuringEvent: string | null = null;
    form.addEventListener('change', () => {
      seenDuringEvent = new FormData(form).get('username') as string | null;
    });

    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'hello';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(seenDuringEvent).toBe('hello');
  });

  test('a form-level change listener sees the new value immediately (date-range-input Apply)', async () => {
    document.body.innerHTML =
      '<form><yatl-date-range-input name="range"></yatl-date-range-input></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlDateRangeInput>(
      'yatl-date-range-input',
    )!;
    await el.updateComplete;

    let seenDuringEvent: [string, FormDataEntryValue][] = [];
    form.addEventListener('change', () => {
      seenDuringEvent = [...new FormData(form).entries()];
    });

    // Open the dropdown and pick a range through the picker, matching
    // what a real user does before clicking Apply.
    const dropdown = el.shadowRoot!.querySelector('yatl-dropdown')!;
    (dropdown as unknown as { open: boolean }).open = true;
    await el.updateComplete;

    const picker = el.shadowRoot!.querySelector('yatl-date-range-picker')!;
    (picker as unknown as { startDate: Date }).startDate = new Date(2024, 0, 1);
    (picker as unknown as { endDate: Date }).endDate = new Date(2024, 0, 31);
    picker.dispatchEvent(new Event('change'));
    await el.updateComplete;

    const applyButton = el.shadowRoot!.querySelector(
      'yatl-button[title="Apply"]',
    ) as HTMLElement;
    applyButton.click();

    expect(seenDuringEvent).toEqual([
      ['range_start', '2024-01-01'],
      ['range_end', '2024-01-31'],
    ]);
  });
});
