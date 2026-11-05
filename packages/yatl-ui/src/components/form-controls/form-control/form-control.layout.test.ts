import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

import '@timlassiter11/yatl/theme.css';
import '../../../index';
import { YatlFormControl } from './form-control';

// These run against real layout, so they check where things actually end
// up rather than which classes or parts they happen to have. The theme is
// loaded because most of the controls' colors (the focus rings included)
// come from its tokens - without them those declarations are invalid.

const option = '<yatl-option value="a" label="Alpha"></yatl-option>';
const radio = '<yatl-radio label="One" value="1"></yatl-radio>';

// Controls where the label, input, hint and error follow the shared layout.
const regularControls: [string, string][] = [
  ['yatl-input', ''],
  ['yatl-number-input', ''],
  ['yatl-textarea', ''],
  ['yatl-select', option],
  ['yatl-date-input', ''],
  ['yatl-date-range-input', ''],
  ['yatl-typeahead', ''],
  ['yatl-search-select', option],
  ['yatl-radio-group', radio],
];

// Controls that put the control before its label.
const toggleControls = ['yatl-checkbox', 'yatl-switch', 'yatl-radio'];

const frame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

async function render(
  tag: string,
  attrs: string,
  children = '',
  width = 400,
): Promise<{ el: YatlFormControl; container: HTMLElement }> {
  document.body.innerHTML = `
    <div id="container" style="width: ${width}px">
      <${tag} ${attrs}>${children}</${tag}>
    </div>
  `;
  const container = document.querySelector<HTMLElement>('#container')!;
  const el = container.firstElementChild as YatlFormControl;
  await el.updateComplete;
  // Dropdown based controls finish laying out a frame later.
  await frame();
  await frame();
  return { el, container };
}

function part(el: Element, selector: string) {
  const found = el.shadowRoot!.querySelector(selector);
  if (!found) {
    throw new Error(`${el.localName} has no ${selector}`);
  }
  return found;
}

const left = (el: Element) => Math.round(el.getBoundingClientRect().left);
const right = (el: Element) => Math.round(el.getBoundingClientRect().right);

// The thing the label/hint/error are arranged around: the input box, or
// for the radio group, the list of radios.
const box = (el: Element) => part(el, '.input, .group');

describe('form control layout - inline', () => {
  test.each(regularControls)(
    '%s: the hint lines up under the input, not under the label',
    async (tag, children) => {
      const { el } = await render(
        tag,
        'inline label="Label" hint="Some hint"',
        children,
      );

      const hint = part(el, '[part="hint"]');
      expect(left(hint)).toBe(left(box(el)));
      // ...which has to actually be to the right of the label.
      expect(left(hint)).toBeGreaterThan(right(part(el, 'yatl-label')) - 1);
    },
  );

  test.each(regularControls)(
    '%s: the error lines up under the input, not under the label',
    async (tag, children) => {
      const { el } = await render(
        tag,
        'inline label="Label" error-text="Something is wrong"',
        children,
      );

      const error = part(el, '[part="error"]');
      expect(left(error)).toBe(left(box(el)));
    },
  );

  test.each(regularControls)(
    '%s: the hint lines up under the input even with no label',
    async (tag, children) => {
      const { el } = await render(tag, 'inline hint="Some hint"', children);

      expect(left(part(el, '[part="hint"]'))).toBe(left(box(el)));
    },
  );

  test.each(regularControls)(
    '%s: the input fills the space the label leaves',
    async (tag, children) => {
      const { el } = await render(tag, 'inline label="Label"', children);

      expect(right(box(el))).toBe(right(el));
      expect(left(box(el))).toBeGreaterThan(right(part(el, 'yatl-label')) - 1);
    },
  );

  test('a long label wraps instead of pushing the input out of the control', async () => {
    const { el, container } = await render(
      'yatl-input',
      'inline label="A fairly long label that will never fit beside the input"',
      '',
      300,
    );

    expect(right(box(el))).toBeLessThanOrEqual(right(container));
    // The label gives up space to the input at half the width, no more.
    expect(box(el).getBoundingClientRect().width).toBeGreaterThanOrEqual(140);
  });

  test.each(toggleControls)(
    '%s: the hint lines up under the control',
    async tag => {
      const { el } = await render(tag, 'label="Label" hint="Some hint"');

      expect(left(part(el, '[part="hint"]'))).toBe(left(box(el)));
    },
  );

  test('a radio group puts its label beside the radios, not above them', async () => {
    const { el } = await render(
      'yatl-radio-group',
      'inline label="Group"',
      radio,
    );

    const label = part(el, 'yatl-label').getBoundingClientRect();
    const group = box(el).getBoundingClientRect();
    expect(group.left).toBeGreaterThanOrEqual(label.right);
    expect(group.top).toBeLessThan(label.bottom);
  });
});

describe('form control layout - stacked', () => {
  test.each(regularControls)(
    '%s: the label, input and hint are stacked at the left edge',
    async (tag, children) => {
      const { el } = await render(
        tag,
        'label="Label" hint="Some hint"',
        children,
      );

      const label = part(el, 'yatl-label').getBoundingClientRect();
      const hint = part(el, '[part="hint"]').getBoundingClientRect();
      const inputBox = box(el).getBoundingClientRect();

      expect(Math.round(label.left)).toBe(left(el));
      expect(Math.round(inputBox.left)).toBe(left(el));
      expect(Math.round(hint.left)).toBe(left(el));
      expect(inputBox.top).toBeGreaterThanOrEqual(label.bottom);
      expect(hint.top).toBeGreaterThanOrEqual(inputBox.bottom);
    },
  );
});

describe('form control layout - sizing', () => {
  test.each(['', 'inline'])(
    'a textarea honors its rows when %j',
    async inline => {
      const { el } = await render(
        'yatl-textarea',
        `${inline} label="Label" rows="4"`,
      );

      // A single line input is 42px tall.
      expect(box(el).getBoundingClientRect().height).toBeGreaterThan(80);
    },
  );

  test('a checkbox is not wrapped in a second frame', async () => {
    const { el } = await render('yatl-checkbox', 'label="Label"');

    const wrapper = part(el, '.input');
    expect(getComputedStyle(wrapper).borderTopWidth).toBe('0px');
    expect(part(el, '#input').getBoundingClientRect().width).toBe(
      wrapper.getBoundingClientRect().width,
    );
  });

  test('a radio is the same size as a checkbox plus its border', async () => {
    const { el: checkbox } = await render('yatl-checkbox', 'label="Label"');
    const checkboxSize = part(checkbox, '.input').getBoundingClientRect().width;

    const { el: radioEl } = await render('yatl-radio', 'label="Label"');
    const radioSize = part(radioEl, '.input').getBoundingClientRect().width;

    expect(radioSize).toBe(checkboxSize + 2);
  });

  // The shared #input rule stretches an element to the box's full height,
  // which pins a single line of text to the top of it.
  test.each(['yatl-date-input', 'yatl-date-range-input'])(
    '%s: the text is centered vertically in the box',
    async tag => {
      const { el } = await render(tag, 'label="Label"');

      const inputBox = part(el, '.input').getBoundingClientRect();
      const value = part(el, '#input');
      const text = value.getBoundingClientRect();
      const offset =
        text.top + text.height / 2 - (inputBox.top + inputBox.height / 2);
      expect(Math.abs(offset)).toBeLessThan(0.5);

      // Centered isn't enough: stretched to the full height the element is
      // centered too, with its single line of text stuck at the top of it.
      const lineHeight = parseFloat(getComputedStyle(value).lineHeight);
      expect(text.height).toBeLessThanOrEqual(lineHeight + 0.5);
    },
  );

  // Both set `color` on the same element, so only the more specific wins.
  test.each(['yatl-date-input', 'yatl-date-range-input'])(
    '%s: the placeholder is dimmed',
    async tag => {
      const { el } = await render(tag, 'label="Label"');

      const inputColor = getComputedStyle(part(el, '.input')).color;
      expect(getComputedStyle(part(el, '#input')).color).not.toBe(inputColor);
    },
  );

  test('a date input with a value is not dimmed', async () => {
    const { el } = await render('yatl-date-input', 'value="2026-03-05"');

    expect(getComputedStyle(part(el, '#input')).color).toBe(
      getComputedStyle(part(el, '.input')).color,
    );
  });

  test("a single select's value isn't drawn inside a second input box", async () => {
    const { el } = await render('yatl-select', 'label="Label"', option);

    const value = part(el, '[part="value"]');
    expect(getComputedStyle(value).borderTopWidth).toBe('0px');
    expect(value.getBoundingClientRect().height).toBeLessThan(
      part(el, '.input').getBoundingClientRect().height,
    );
  });
});

describe('form control layout - parts', () => {
  const everything: [string, string][] = [
    ...regularControls,
    ...toggleControls.map(tag => [tag, ''] as [string, string]),
  ];

  // `base` is the whole row and `input` the box inside it. If a control
  // also reuses either name for something else, ::part() hits both.
  test.each(everything)(
    '%s has exactly one base and one input part, input inside base',
    async (tag, children) => {
      const { el } = await render(tag, 'label="Label"', children);
      const parts = [...el.shadowRoot!.querySelectorAll('[part]')];
      const named = (name: string) =>
        parts.filter(p => p.getAttribute('part')!.split(/\s+/).includes(name));

      expect(named('base')).toHaveLength(1);
      expect(named('input')).toHaveLength(1);
      expect(named('base')[0].contains(named('input')[0])).toBe(true);
    },
  );
});

describe('form control layout - keyboard focus', () => {
  // Tabbing in is what makes :focus-visible match.
  async function tabInto(tag: string, children = '') {
    const { el } = await render(tag, 'label="Label"', children);
    await userEvent.keyboard('{Tab}');
    // Some controls transition `all`, which includes the outline.
    await new Promise(resolve => setTimeout(resolve, 200));
    return el;
  }

  const outlined = (el: Element) =>
    getComputedStyle(el).outlineStyle !== 'none';

  test('a checkbox shows a focus ring', async () => {
    const el = await tabInto('yatl-checkbox');
    expect(outlined(part(el, '#input'))).toBe(true);
  });

  test('a radio shows a focus ring', async () => {
    const el = await tabInto('yatl-radio');
    expect(outlined(part(el, '.input'))).toBe(true);
  });

  test('a switch shows a focus ring', async () => {
    const el = await tabInto('yatl-switch');
    expect(outlined(part(el, '.input'))).toBe(true);
  });

  test('a select shows its focus ring on the box, not the browser default on the trigger', async () => {
    const el = await tabInto('yatl-select', option);

    expect(outlined(part(el, '.input'))).toBe(true);
    expect(outlined(part(el, '[slot="trigger"]'))).toBe(false);
  });
});
