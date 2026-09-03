import { html, render } from 'lit';
import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlCheckbox } from '../checkbox/checkbox';
import { YatlInput } from '../input/input';
import { YatlTextArea } from '../textarea/textarea';
import { YatlRadioGroup } from '../radio-group/radio-group';
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

// Regression coverage for a bug where <yatl-input value=${x}> (and
// textarea/radio-group) silently ignored the value when it arrived via a
// genuine lit-html AttributePart binding, even though the identical-looking
// static attribute (`value="literal"`, whether typed by hand or baked into
// a template as a non-interpolated string) always worked. That masked the
// bug for a long time: a custom element already registered via
// customElements.define() is upgraded - constructor and all - synchronously
// as part of the clone/importNode Lit uses to stamp out template content,
// which happens *before* Lit commits any bound attribute parts onto that
// clone. Anything that tries to read the raw attribute directly from a
// field initializer (as `value`'s used to, to seed itself ahead of
// YatlFormControl.willUpdate()'s defaultValue -> value sync) sees nothing
// yet in that case. Rendering through lit-html's own render()/html() here -
// instead of the innerHTML string parsing every other test in this file
// uses - is what actually exercises that code path.
describe('YatlFormControl - value seeded from a dynamic lit-html binding', () => {
  test('yatl-input', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const dynamicValue = 'from-a-binding';

    render(html`<yatl-input value=${dynamicValue}></yatl-input>`, container);
    const el = container.querySelector<YatlInput>('yatl-input')!;
    await el.updateComplete;

    expect(el.value).toBe(dynamicValue);
    container.remove();
  });

  test('yatl-textarea', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const dynamicValue = 'from-a-binding';

    render(
      html`<yatl-textarea value=${dynamicValue}></yatl-textarea>`,
      container,
    );
    const el = container.querySelector<YatlTextArea>('yatl-textarea')!;
    await el.updateComplete;

    expect(el.value).toBe(dynamicValue);
    container.remove();
  });

  test('yatl-radio-group', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const dynamicValue = 'b';

    render(
      html`
        <yatl-radio-group value=${dynamicValue}>
          <yatl-radio value="a"></yatl-radio>
          <yatl-radio value="b"></yatl-radio>
        </yatl-radio-group>
      `,
      container,
    );
    const group = container.querySelector<YatlRadioGroup>('yatl-radio-group')!;
    const radios = [...group.querySelectorAll('yatl-radio')] as {
      updateComplete: Promise<unknown>;
      checked: boolean;
    }[];
    await Promise.all([group, ...radios].map(el => el.updateComplete));

    expect(group.value).toBe(dynamicValue);
    expect(radios.map(r => r.checked)).toEqual([false, true]);
    container.remove();
  });
});
